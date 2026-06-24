import { useExplorerStore } from '@/stores/explorer.store'
import { useLayoutStore } from '@/stores/layout.store'
import { useTabsStore } from '@/stores/tabs.store'
import { executionConfig } from '@/components/tabs/tab.data'
import { sendWindowCommand } from './menu.cef'

export type MenubarItemConfig =
  | { type: 'item'; label: string; shortcut?: string; action?: () => void }
  | { type: 'separator' }

export interface MenuConfig {
  trigger: string
  items: MenubarItemConfig[]
}

function newFile() {
  useTabsStore().openTab({
    id: crypto.randomUUID(),
    name: 'untitled.py',
    language: 'python',
    content: '',
  })
}

function closeActiveTab() {
  const tabs = useTabsStore()
  if (tabs.activeTabId) tabs.closeTab(tabs.activeTabId)
}

function execute(id: 'run' | 'debug') {
  executionConfig.find((c) => c.id === id)?.action?.()
}

export const menuConfig: MenuConfig[] = [
  {
    trigger: 'File',
    items: [
      { type: 'item', label: 'New File', shortcut: 'Ctrl+N', action: newFile },
      { type: 'item', label: 'Open File…', shortcut: 'Ctrl+O' },
      {
        type: 'item',
        label: 'Open Folder…',
        shortcut: 'Ctrl+K Ctrl+O',
        action: () => useExplorerStore().openFolder(),
      },
      { type: 'separator' },
      { type: 'item', label: 'Save', shortcut: 'Ctrl+S' },
      { type: 'item', label: 'Save As…', shortcut: 'Ctrl+Shift+S' },
      { type: 'item', label: 'Save All', shortcut: 'Ctrl+K S' },
      { type: 'separator' },
      { type: 'item', label: 'Close Editor', shortcut: 'Ctrl+W', action: closeActiveTab },
      { type: 'separator' },
      { type: 'item', label: 'Exit', shortcut: 'Ctrl+Q', action: () => sendWindowCommand('closeWindow') },
    ],
  },
  {
    trigger: 'Edit',
    items: [
      { type: 'item', label: 'Undo', shortcut: 'Ctrl+Z' },
      { type: 'item', label: 'Redo', shortcut: 'Ctrl+Y' },
      { type: 'separator' },
      { type: 'item', label: 'Cut', shortcut: 'Ctrl+X' },
      { type: 'item', label: 'Copy', shortcut: 'Ctrl+C' },
      { type: 'item', label: 'Paste', shortcut: 'Ctrl+V' },
      { type: 'separator' },
      { type: 'item', label: 'Find', shortcut: 'Ctrl+F' },
      { type: 'item', label: 'Replace', shortcut: 'Ctrl+H' },
    ],
  },
  {
    trigger: 'Selection',
    items: [
      { type: 'item', label: 'Select All', shortcut: 'Ctrl+A' },
      { type: 'item', label: 'Expand Selection', shortcut: 'Shift+Alt+→' },
      { type: 'item', label: 'Shrink Selection', shortcut: 'Shift+Alt+←' },
      { type: 'separator' },
      { type: 'item', label: 'Copy Line Up', shortcut: 'Shift+Alt+↑' },
      { type: 'item', label: 'Copy Line Down', shortcut: 'Shift+Alt+↓' },
    ],
  },
  {
    trigger: 'View',
    items: [
      { type: 'item', label: 'Command Palette…', shortcut: 'Ctrl+Shift+P' },
      { type: 'separator' },
      { type: 'item', label: 'Zoom In', shortcut: 'Ctrl+=' },
      { type: 'item', label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { type: 'item', label: 'Reset Zoom', shortcut: 'Ctrl+0' },
      { type: 'separator' },
      { type: 'item', label: 'Project Panel', action: () => useLayoutStore().toggleExplorer() },
      { type: 'item', label: 'Terminal Panel', action: () => useLayoutStore().toggleTerminal() },
      { type: 'item', label: 'Visualizer Panel', action: () => useLayoutStore().toggleVisualizer() },
    ],
  },
  {
    trigger: 'Run',
    items: [
      { type: 'item', label: 'Run Program', shortcut: 'F5', action: () => execute('run') },
      { type: 'item', label: 'Debug Program', shortcut: 'F9', action: () => execute('debug') },
    ],
  },
  {
    trigger: 'Help',
    items: [
      { type: 'item', label: 'Documentation' },
      { type: 'item', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S' },
      { type: 'separator' },
      { type: 'item', label: 'About AlgoLens' },
    ],
  },
]
