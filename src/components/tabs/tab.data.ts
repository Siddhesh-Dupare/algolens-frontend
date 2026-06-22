import type { Component } from 'vue'
import { Play, BugPlay } from '@lucide/vue'

import { useTabsStore } from '@/stores/tabs.store'
import { useServerStore } from '@/stores/server.store'
import { useLayoutStore } from '@/stores/layout.store'
import type { Language } from '@/types/server-protocol'

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

function onDebug() {
  sendIR({
    version: 1,
    components: [
      { type: 'array', values: [9, 1, 7, 3, 5] },
      { type: 'variables', items: [{ name: 'i', value: '0' }] },
    ],
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
