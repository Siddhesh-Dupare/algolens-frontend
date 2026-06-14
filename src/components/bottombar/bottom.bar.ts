import { ListTree, UsersRound, SquareTerminal, Box, Astroid } from '@lucide/vue'
import type { Component } from 'vue'

export type BarStripControl = {
  id: string
  label: string
  symbol: Component
  action?: () => void
}

export const stripLeftConfig: BarStripControl[] = [
  {
    id: 'tree-list',
    label: 'Explorer',
    symbol: ListTree,
  },
  {
    id: 'users-collab',
    label: 'Collab',
    symbol: UsersRound,
  },
]

export const stripRightConfig: BarStripControl[] = [
  {
    id: 'terminal-panel',
    label: 'Terminal',
    symbol: SquareTerminal,
  },
  {
    id: 'visualizer-panel',
    label: 'Visualizer',
    symbol: Box,
  },
  {
    id: 'agent-panel',
    label: 'Agent',
    symbol: Astroid,
  },
]
