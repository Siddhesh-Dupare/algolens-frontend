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

// Names that suggest a row/col index, used to place the grid's cell cursor.
const GRID_ROW_NAMES = ['i', 'r', 'row', 'x']
const GRID_COL_NAMES = ['j', 'c', 'col', 'y']

function pickIndex(
  intScalars: { name: string; n: number }[],
  names: string[],
  bound: number,
): number | null {
  for (const { name, n } of intScalars) {
    if (names.includes(name) && n >= 0 && n < bound) return n
  }
  return null
}

// Variable names that signal a LIFO stack or FIFO queue. A plain list with no
// matching name stays a plain array; a `deque` value is always a queue.
const STACK_NAMES = ['stack', 'stk', 'st']
const QUEUE_NAMES = ['queue', 'q', 'que', 'qu']

// Linked-list traversal pointers whose target node is highlighted "active".
const LL_CURSOR_NAMES = ['curr', 'cur', 'current', 'node', 'root', 'p', 'ptr', 'temp', 'tmp', 'walker']

// Scalars that name a "current vertex" in graph traversals.
const GRAPH_CURSOR_NAMES = [
  'u', 'v', 'node', 'curr', 'cur', 'current', 'start', 'src', 'source', 'vertex', 'x', 'w',
]
// Collections whose members are graph nodes already explored (drawn green).
const VISITED_NAMES = ['visited', 'seen', 'explored', 'done']

function classifyLinear(name: string): 'array' | 'stack' | 'queue' {
  const n = name.toLowerCase()
  if (STACK_NAMES.includes(n) || n.includes('stack')) return 'stack'
  if (QUEUE_NAMES.includes(n) || n.includes('queue')) return 'queue'
  return 'array'
}

// Split a list's inner text ("1, 2, 3") into display strings.
function parseList(inner: string): string[] {
  return inner
    .split(',')
    .map(unquote)
    .filter((s) => s.length > 0)
}

// Build the Visual IR for one frame.
//  - 2-D lists -> grid. When several exist (e.g. inputs a, b + result res), the
//    grid being *written* this step is featured, and stays featured ("sticky")
//    so a result table keeps showing even after it stops changing.
//  - 1-D list / quoted string -> array (with index pointers).
// Highlights come from diffing vs. the previous frame: changed cells/elements ->
// "swap" (red); otherwise the cell cursor / pointed elements -> "active"/"compare".
function extractFrame(
  frame: TraceFrame,
  prevLinears: Record<string, string[]>,
  prevGrids: Record<string, string[][]>,
  activeGrid: string | null,
) {
  // Each renderable structure, tagged active (current frame touches it -> main
  // stage) or not (-> parked thumbnail). `label` is the variable name.
  const structures: { active: boolean; label: string; component: object }[] = []

  // Every 1-D structure (array / stack / queue) seen this frame. All are shown,
  // so e.g. a string and its stack appear together.
  const linears: { name: string; kind: 'array' | 'stack' | 'queue'; values: string[] }[] = []
  const lists: { name: string; nodes: string[]; pointers: Record<string, number>; doubly: boolean }[] = []
  const trees: {
    name: string
    nodes: { value: string; children: number[] }[]
    binary: boolean
    pointers: Record<string, number>
  }[] = []
  const graphs: {
    name: string
    nodes: string[]
    edges: (number | string)[][]
    directed: boolean
    pointers: Record<string, number>
  }[] = []
  const grids: Record<string, string[][]> = {}
  const scalars: { name: string; value: string }[] = []
  const intScalars: { name: string; n: number }[] = []

  // scope of each variable: 'outer' structures are parked, 'local' go on main.
  const scopeByName: Record<string, 'local' | 'outer'> = {}
  for (const v of Object.values(frame.variables)) {
    scopeByName[v.name] = v.scope === 'outer' ? 'outer' : 'local'
  }
  const addStruct = (label: string, component: object) => {
    structures.push({ active: scopeByName[label] !== 'outer', label, component })
  }

  for (const v of Object.values(frame.variables)) {
    const raw = (v.value ?? '').trim()

    // 2-D list -> collect as a grid candidate (keyed by variable name).
    if (raw.startsWith('[[')) {
      const g = parseGrid(raw)
      if (g) {
        grids[v.name] = g
        continue
      }
    }
    // linkedlist -> the tracer pre-serialized the chain + named pointers.
    if (v.type === 'linkedlist') {
      try {
        const ll = JSON.parse(v.value) as {
          nodes: string[]
          pointers: Record<string, number>
          doubly: boolean
        }
        lists.push({
          name: v.name,
          nodes: ll.nodes ?? [],
          pointers: ll.pointers ?? {},
          doubly: !!ll.doubly,
        })
      } catch {
        // ignore malformed payloads
      }
      continue
    }
    // tree (binary / BST / n-ary / AST) -> tracer pre-serialized nodes + pointers.
    if (v.type === 'tree') {
      try {
        const t = JSON.parse(v.value) as {
          nodes: { v: string; children: number[] }[]
          binary: boolean
          pointers: Record<string, number>
        }
        trees.push({
          name: v.name,
          nodes: (t.nodes ?? []).map((nd) => ({ value: nd.v, children: nd.children ?? [] })),
          binary: !!t.binary,
          pointers: t.pointers ?? {},
        })
      } catch {
        // ignore malformed payloads
      }
      continue
    }
    // graph (adjacency dict / node objects) -> nodes + edges from the tracer.
    if (v.type === 'graph') {
      try {
        const g = JSON.parse(v.value) as {
          nodes: string[]
          edges: (number | string)[][]
          directed: boolean
          pointers: Record<string, number>
        }
        graphs.push({
          name: v.name,
          nodes: g.nodes ?? [],
          edges: g.edges ?? [],
          directed: !!g.directed,
          pointers: g.pointers ?? {},
        })
      } catch {
        // ignore malformed payloads
      }
      continue
    }
    // deque(...) -> queue (collections.deque is the canonical FIFO queue).
    if (v.type === 'deque' || raw.startsWith('deque(')) {
      const lb = raw.indexOf('[')
      const rb = raw.indexOf(']', lb)
      if (lb !== -1 && rb !== -1) {
        linears.push({ name: v.name, kind: 'queue', values: parseList(raw.slice(lb + 1, rb)) })
        continue
      }
    }
    // 1-D list -> array / stack / queue by variable name (exclude 2-D "[[").
    if (raw.startsWith('[') && !raw.startsWith('[[') && raw.endsWith(']')) {
      linears.push({ name: v.name, kind: classifyLinear(v.name), values: parseList(raw.slice(1, -1)) })
      continue
    }
    // quoted string of 2+ chars -> char array. Single chars stay scalars.
    if (
      raw.length >= 2 &&
      ((raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"')))
    ) {
      const chars = unquote(raw).split('')
      if (chars.length >= 2) {
        linears.push({ name: v.name, kind: 'array', values: chars })
        continue
      }
    }
    // scalar
    scalars.push({ name: v.name, value: v.value })
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && String(n) === raw) intScalars.push({ name: v.name, n })
  }

  // Pick which grid to feature: the one that changed this step (being written);
  // else the previously-featured one (sticky); else the first.
  const gridNames = Object.keys(grids)
  let chosen: string | null = null
  if (gridNames.length > 0) {
    let changedName: string | null = null
    for (const name of gridNames) {
      const prev = prevGrids[name]
      const cur = grids[name]
      if (prev && cur && JSON.stringify(prev) !== JSON.stringify(cur)) {
        changedName = name
        break
      }
    }
    if (changedName) chosen = changedName
    else if (activeGrid && grids[activeGrid]) chosen = activeGrid
    else chosen = gridNames[0] ?? null
  }

  if (chosen) {
    const grid = grids[chosen]
    if (grid) {
      const prev = prevGrids[chosen]
      const highlights: Record<string, string> = {}
      let changed = false
      if (prev && prev.length === grid.length) {
        for (let r = 0; r < grid.length; r++) {
          const row = grid[r]
          const pr = prev[r]
          if (!row || !pr || pr.length !== row.length) continue
          for (let cc = 0; cc < row.length; cc++) {
            if (row[cc] !== pr[cc]) {
              highlights[`${r},${cc}`] = 'swap'
              changed = true
            }
          }
        }
      }
      // No write this step -> show the (row, col) cell cursor from index vars.
      if (!changed) {
        const rows = grid.length
        let cols = 0
        for (const row of grid) cols = Math.max(cols, row.length)
        const ri = pickIndex(intScalars, GRID_ROW_NAMES, rows)
        const ci = pickIndex(intScalars, GRID_COL_NAMES, cols)
        if (ri !== null && ci !== null) highlights[`${ri},${ci}`] = 'active'
      }
      addStruct(chosen, { type: 'grid', values: grid, highlights })
    }
  }

  // Emit every linear structure so several can show at once (e.g. a string and
  // its stack). Each diffs against its own previous value for highlights.
  for (const lin of linears) {
    const prev = prevLinears[lin.name]
    const values = lin.values
    if (lin.kind === 'stack') {
      // LIFO: the last element is the top, where push/pop happen.
      const top = values.length - 1
      const highlights: Record<number, string> = {}
      if (prev && values.length > prev.length) highlights[top] = 'swap' // push
      else if (top >= 0) highlights[top] = 'active'
      addStruct(lin.name, { type: 'stack', values, highlights, top })
    } else if (lin.kind === 'queue') {
      // FIFO: enqueue at the rear, dequeue from the front.
      const front = 0
      const rear = values.length - 1
      const highlights: Record<number, string> = {}
      if (prev && values.length > prev.length) highlights[rear] = 'swap' // enqueue
      else if (rear >= 0) highlights[front] = 'active' // dequeue end
      addStruct(lin.name, { type: 'queue', values, highlights, front, rear })
    } else {
      // Pointers = integer scalars whose value is a valid index into this array.
      const pointers: Record<string, number> = {}
      for (const { name, n } of intScalars) {
        if (n >= 0 && n < values.length) pointers[name] = n
      }

      const highlights: Record<number, string> = {}
      const changed: number[] = []
      if (prev && prev.length === values.length) {
        for (let k = 0; k < values.length; k++) {
          if (values[k] !== prev[k]) changed.push(k)
        }
      }
      if (changed.length > 0) {
        for (const k of changed) highlights[k] = 'swap'
      } else {
        for (const idx of Object.values(pointers)) highlights[idx] = 'compare'
      }

      addStruct(lin.name, { type: 'array', values, highlights, pointers })
    }
  }

  const linearsOut: Record<string, string[]> = {}
  for (const lin of linears) linearsOut[lin.name] = lin.values

  // Linked lists: highlight nodes whose value changed (swap) and the node a
  // traversal pointer lands on (active). Diffs against its own previous nodes.
  for (const ll of lists) {
    const prev = prevLinears[ll.name]
    const highlights: Record<number, string> = {}
    if (prev && prev.length === ll.nodes.length) {
      for (let k = 0; k < ll.nodes.length; k++) {
        if (ll.nodes[k] !== prev[k]) highlights[k] = 'swap'
      }
    }
    for (const [pname, idx] of Object.entries(ll.pointers)) {
      if (LL_CURSOR_NAMES.includes(pname.toLowerCase()) && highlights[idx] === undefined) {
        highlights[idx] = 'active'
      }
    }
    addStruct(ll.name, {
      type: 'linkedlist',
      values: ll.nodes,
      pointers: ll.pointers,
      doubly: ll.doubly,
      highlights,
    })
    linearsOut[ll.name] = ll.nodes
  }

  // Trees: highlight nodes whose value changed (swap) and the node a traversal
  // pointer lands on (active). Diffs node values against the previous frame.
  for (const tr of trees) {
    const values = tr.nodes.map((nd) => nd.value)
    const prev = prevLinears[tr.name]
    const highlights: Record<number, string> = {}
    if (prev && prev.length === values.length) {
      for (let k = 0; k < values.length; k++) {
        if (values[k] !== prev[k]) highlights[k] = 'swap'
      }
    }
    for (const [pname, idx] of Object.entries(tr.pointers)) {
      if (LL_CURSOR_NAMES.includes(pname.toLowerCase()) && highlights[idx] === undefined) {
        highlights[idx] = 'active'
      }
    }
    addStruct(tr.name, {
      type: 'tree',
      nodes: tr.nodes,
      binary: tr.binary,
      pointers: tr.pointers,
      highlights,
    })
    linearsOut[tr.name] = values
  }

  // Graphs: explored nodes (from a visited/seen collection) go green; cursor
  // scalars (u/v/node/...) that name a node go blue.
  for (const g of graphs) {
    const labelIndex = new Map(g.nodes.map((lab, i) => [lab, i]))
    const highlights: Record<number, string> = {}

    for (const lin of linears) {
      if (!VISITED_NAMES.includes(lin.name.toLowerCase())) continue
      for (const val of lin.values) {
        const idx = labelIndex.get(val)
        if (idx !== undefined) highlights[idx] = 'sorted'
      }
    }

    const pointers: Record<string, number> = { ...g.pointers }
    for (const s of scalars) {
      if (!GRAPH_CURSOR_NAMES.includes(s.name.toLowerCase())) continue
      const idx = labelIndex.get(unquote(s.value))
      if (idx !== undefined) pointers[s.name] = idx
    }
    for (const idx of Object.values(pointers)) {
      if (highlights[idx] === undefined) highlights[idx] = 'active'
    }

    addStruct(g.name, {
      type: 'graph',
      nodes: g.nodes,
      edges: g.edges,
      directed: g.directed,
      pointers,
      highlights,
    })
  }

  // Split into the active main stage and parked thumbnails. If the current frame
  // touches no structure, nothing is parked (everything stays on the main stage).
  const activeStructs = structures.filter((s) => s.active)
  const mainStructs = activeStructs.length > 0 ? activeStructs : structures
  const parkedStructs = activeStructs.length > 0 ? structures.filter((s) => !s.active) : []

  const components: object[] = mainStructs.map((s) => s.component)
  // Scalars always sit on the main stage as a corner overlay.
  if (scalars.length > 0) components.push({ type: 'variables', items: scalars })

  const parked = parkedStructs.map((s) => ({ label: s.label, components: [s.component] }))

  return {
    ir: { version: 1, components, parked },
    linears: linearsOut,
    grids,
    activeGrid: chosen ?? activeGrid,
  }
}

function onDebug() {
  const tab = useTabsStore().activeTab
  if (!tab) return

  const server = useServerStore()
  const playback = usePlaybackStore()
  server.connect()

  const id = crypto.randomUUID()
  const collected: { ir: object; line: number }[] = []
  let prevLinears: Record<string, string[]> = {}
  let prevGrids: Record<string, string[][]> = {}
  let activeGrid: string | null = null

  const unsubscribe = server.onMessage((msg: ServerMessage) => {
    if (msg.type === 'ready') return
    if (msg.id !== id) return

    if (msg.type === 'frame') {
      // Capture every step (IR + source line); playback drives it afterwards.
      const r = extractFrame(msg, prevLinears, prevGrids, activeGrid)
      collected.push({ ir: r.ir, line: msg.lineNumber })
      prevLinears = r.linears
      prevGrids = r.grids
      activeGrid = r.activeGrid
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
