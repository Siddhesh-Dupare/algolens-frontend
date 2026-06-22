import type { Component } from 'vue'
import { Play, BugPlay } from '@lucide/vue'

import { useTabsStore } from '@/stores/tabs.store'
import { useServerStore } from '@/stores/server.store'
import { useLayoutStore } from '@/stores/layout.store'
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

function classifyFrameToIR(frame: TraceFrame) {
  const components: object[] = []
  const scalars: { name: string; value: string }[] = []

  for (const v of Object.values(frame.variables)) {
    const val = (v.value ?? '').trim()
    const looksArray = val.startsWith('[') && val.endsWith(']')
    if (looksArray) {
      // "[5, 2, 8, 1]" -> [5, 2, 8, 1]  (renderer's array component needs `values`)
      const values = val
        .slice(1, -1)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      components.push({ type: 'array', values })
    } else {
      scalars.push({ name: v.name, value: v.value })
    }
  }

  // All scalar variables go into one `variables` component with `items`.
  if (scalars.length > 0) {
    components.push({ type: 'variables', items: scalars })
  }

  return { version: 1, components }
}

function onDebug() {
  const tab = useTabsStore().activeTab
  if (!tab) return

  const server = useServerStore()
  server.connect()

  const id = crypto.randomUUID()

  const unsubscribe = server.onMessage((msg: ServerMessage) => {
    if (msg.type === 'ready') return
    if (msg.id !== id) return

    if (msg.type === 'frame') {
      sendIR(classifyFrameToIR(msg))
    }
    if (msg.type === 'complete' || msg.type === 'error') {
      unsubscribe()
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
