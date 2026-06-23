import type { Component } from 'vue'
import { Play, BugPlay } from '@lucide/vue'

import { useTabsStore } from '@/stores/tabs.store'
import { useServerStore } from '@/stores/server.store'
import { useLayoutStore } from '@/stores/layout.store'
import { usePlaybackStore } from '@/stores/playback.store'
import type { Language, TraceFrame, ServerMessage } from '@/types/server-protocol'

export type ExecutionControl = {
  id: string
  label: string
  symbol: Component
  action?: () => void
}

export function sendIR(ir: object) {
  if (window.cefQuery) {
    // only exists inside the CEF shell
    window.cefQuery({
      request: JSON.stringify(ir),
      onSuccess: () => {},
      onFailure: (code, msg) => console.error('cefQuery failed', code, msg),
    })
  } else {
    console.warn('Not running inside AlgoLens — cefQuery unavailable')
  }
}

function onRun() {
  useLayoutStore().terminalVisible = true
  const tabsStore = useTabsStore()
  const tab = tabsStore.activeTab
  if (!tab) return

  const server = useServerStore()
  server.connect()
  server.send({
    type: 'run',
    id: crypto.randomUUID(),
    language: tab.language as Language,
    code: tab.content,
    filename: `main.${tab.language}`,
  })
}

// Trim a value and strip one layer of surrounding quotes (chars / strings).
function unquote(s: string): string {
  s = s.trim()
  if (
    s.length >= 2 &&
    ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"'))
  ) {
    return s.slice(1, -1)
  }
  return s
}

// Parse a 2-D list value "[[1, 2], [3, 4]]" into rows of display strings.
function parseGrid(raw: string): string[][] | null {
  raw = raw.trim()
  if (!raw.startsWith('[') || !raw.endsWith(']')) return null
  const inner = raw.slice(1, -1).trim()
  if (!inner.startsWith('[')) return null // not 2-D
  const rows: string[][] = []
  let i = 0
  while (i < inner.length) {
    if (inner[i] === '[') {
      const end = inner.indexOf(']', i)
      if (end === -1) return null
      rows.push(
        inner
          .slice(i + 1, end)
          .split(',')
          .map(unquote)
          .filter((s) => s.length > 0),
      )
      i = end + 1
    } else {
      i++
    }
  }
  return rows.length > 0 ? rows : null
}

// Build the Visual IR for one frame. Array elements are kept as display strings
// (ints, chars, … all render). A quoted string variable becomes a char array.
// Highlights are derived by diffing against the previous frame's array:
//   changed element -> "swap" (red); otherwise pointed elements -> "compare".
// Returns the IR plus the extracted array (so the caller can diff the next one).
function extractFrame(
  frame: TraceFrame,
  prevArr: string[] | null,
  prevGrid: string[][] | null,
) {
  const components: object[] = []

  let arr: string[] | null = null
  let grid: string[][] | null = null
  const scalars: { name: string; value: string }[] = []
  const intScalars: { name: string; n: number }[] = []

  for (const v of Object.values(frame.variables)) {
    const raw = (v.value ?? '').trim()

    // 2-D list -> grid (preferred over a 1-D array when both are present).
    if (!grid && raw.startsWith('[[')) {
      const g = parseGrid(raw)
      if (g) {
        grid = g
        continue
      }
    }
    // 1-D list -> array (exclude 2-D, which starts with "[[").
    if (!arr && raw.startsWith('[') && !raw.startsWith('[[') && raw.endsWith(']')) {
      arr = raw
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s))
        .filter((s) => s.length > 0)
      continue
    }
    // quoted string -> char array.
    if (
      !arr &&
      raw.length >= 2 &&
      ((raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"')))
    ) {
      arr = unquote(raw).split('')
      continue
    }
    // scalar
    scalars.push({ name: v.name, value: v.value })
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && String(n) === raw) intScalars.push({ name: v.name, n })
  }

  if (grid) {
    // Highlight cells that changed value vs. the previous frame (writes) — this
    // is what makes a DP table visibly "fill in" as it's computed.
    const highlights: Record<string, string> = {}
    if (prevGrid && prevGrid.length === grid.length) {
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r]
        const pr = prevGrid[r]
        if (!row || !pr || pr.length !== row.length) continue
        for (let cc = 0; cc < row.length; cc++) {
          if (row[cc] !== pr[cc]) highlights[`${r},${cc}`] = 'swap'
        }
      }
    }
    components.push({ type: 'grid', values: grid, highlights })
  } else if (arr) {
    // Pointers = integer scalars whose value is a valid index into the array
    // (i, j, mid, low, high, …). Cheap, language-agnostic heuristic.
    const pointers: Record<string, number> = {}
    for (const { name, n } of intScalars) {
      if (n >= 0 && n < arr.length) pointers[name] = n
    }

    const highlights: Record<number, string> = {}

    // Which elements changed value vs. the previous frame? That's a write/swap.
    const changed: number[] = []
    if (prevArr && prevArr.length === arr.length) {
      for (let k = 0; k < arr.length; k++) {
        if (arr[k] !== prevArr[k]) changed.push(k)
      }
    }

    if (changed.length > 0) {
      for (const k of changed) highlights[k] = 'swap'
    } else {
      // No write this step → the pointed elements are being compared.
      for (const idx of Object.values(pointers)) highlights[idx] = 'compare'
    }

    components.push({ type: 'array', values: arr, highlights, pointers })
  }

  // All scalar variables go into one `variables` component with `items`.
  if (scalars.length > 0) {
    components.push({ type: 'variables', items: scalars })
  }

  return { ir: { version: 1, components }, arr, grid }
}

function onDebug() {
  const tab = useTabsStore().activeTab
  if (!tab) return

  const server = useServerStore()
  const playback = usePlaybackStore()
  server.connect()

  const id = crypto.randomUUID()
  const collected: { ir: object; line: number }[] = []
  let prevArr: string[] | null = null
  let prevGrid: string[][] | null = null

  const unsubscribe = server.onMessage((msg: ServerMessage) => {
    if (msg.type === 'ready') return
    if (msg.id !== id) return

    if (msg.type === 'frame') {
      // Capture every step (IR + source line); playback drives it afterwards.
      const { ir, arr, grid } = extractFrame(msg, prevArr, prevGrid)
      collected.push({ ir, line: msg.lineNumber })
      prevArr = arr ?? prevArr
      prevGrid = grid ?? prevGrid
    }
    if (msg.type === 'complete' || msg.type === 'error') {
      unsubscribe()
      playback.setFrames(collected) // loads frames + shows frame 0
    }
  })

  server.send({
    type: 'debug',
    id,
    language: tab.language as Language,
    code: tab.content,
    filename: `main.${tab.language}`,
  })
}

export const executionConfig: ExecutionControl[] = [
  {
    id: 'run',
    label: 'Run',
    symbol: Play,
    action: () => onRun(),
  },
  {
    id: 'debug',
    label: 'Debug',
    symbol: BugPlay,
    action: () => onDebug(),
  },
]
