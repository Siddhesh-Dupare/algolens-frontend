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

// Build the Visual IR for one frame. Diffs against the previous frame's array
// so highlights are accurate without relying on the tracer's step type:
//   - elements whose value changed since last frame  -> "swap"   (red)
//   - otherwise the pointed (indexed) elements        -> "compare" (amber)
// Returns the IR plus the extracted array (so the caller can diff the next one).
function extractFrame(frame: TraceFrame, prevArr: number[] | null) {
  const components: object[] = []

  let arr: number[] | null = null
  const scalars: { name: string; value: string }[] = []
  const intScalars: { name: string; n: number }[] = []

  for (const v of Object.values(frame.variables)) {
    const val = (v.value ?? '').trim()
    if (!arr && val.startsWith('[') && val.endsWith(']')) {
      // first array-looking variable -> the array component
      arr = val
        .slice(1, -1)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
    } else {
      scalars.push({ name: v.name, value: v.value })
      const n = parseInt(val, 10)
      if (!Number.isNaN(n) && String(n) === val) intScalars.push({ name: v.name, n })
    }
  }

  if (arr) {
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

  return { ir: { version: 1, components }, arr }
}

function onDebug() {
  const tab = useTabsStore().activeTab
  if (!tab) return

  const server = useServerStore()
  const playback = usePlaybackStore()
  server.connect()

  const id = crypto.randomUUID()
  const collected: { ir: object; line: number }[] = []
  let prevArr: number[] | null = null

  const unsubscribe = server.onMessage((msg: ServerMessage) => {
    if (msg.type === 'ready') return
    if (msg.id !== id) return

    if (msg.type === 'frame') {
      // Capture every step (IR + source line); playback drives it afterwards.
      const { ir, arr } = extractFrame(msg, prevArr)
      collected.push({ ir, line: msg.lineNumber })
      prevArr = arr ?? prevArr
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
