import { useExplorerStore } from '@/stores/explorer.store'
import { useLayoutStore } from '@/stores/layout.store'

export type MenubarItemConfig =
  | { type: 'item'; label: string; shortcut?: string; action?: () => void }
  | { type: 'separator' }

export interface MenuConfig {
  trigger: string
  items: MenubarItemConfig[]
}

export const menuConfig: MenuConfig[] = [
  {
    trigger: 'File',
    items: [
      { type: 'item', label: 'New' },
      { type: 'separator' },
      { type: 'item', label: 'Open File...', shortcut: 'Ctrl+O' },
      {
        type: 'item',
        label: 'Open Folder...',
        shortcut: 'Ctrl+K',
        action: () => useExplorerStore().openFolder(),
      },
      { type: 'separator' },
      { type: 'item', label: 'Save', shortcut: 'Ctrl+S' },
      { type: 'item', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    ],
  },
  {
    trigger: 'Edit',
    items: [
      { type: 'item', label: 'Undo', shortcut: 'Ctrl+Z' },
      { type: 'item', label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
      { type: 'separator' },
      { type: 'item', label: 'Cut', shortcut: 'Ctrl+X' },
      { type: 'item', label: 'Copy', shortcut: 'Ctrl+C' },
    ],
  },
  {
    trigger: 'View',
    items: [
      { type: 'item', label: 'Zoom In', shortcut: 'Ctrl+Shit+=' },
      { type: 'item', label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { type: 'item', label: 'Reset Zoom', shortcut: 'Ctrl+0' },
      { type: 'separator' },
      { type: 'item', label: 'Project Panel', action: () => useLayoutStore().toggleExplorer() },
      { type: 'item', label: 'Terminal Panel', action: () => useLayoutStore().toggleTerminal() },
      {
        type: 'item',
        label: 'Visualizer Panel',
        action: () => useLayoutStore().toggleVisualizer(),
      },
    ],
  },
  {
    trigger: 'Help',
    items: [{ type: 'item', label: 'Documentation' }],
  },
]
