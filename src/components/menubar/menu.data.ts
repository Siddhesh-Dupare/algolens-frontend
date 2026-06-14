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
      { type: 'item', label: 'Open Folder...', shortcut: 'Ctrl+K' },
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
    trigger: 'Help',
    items: [{ type: 'item', label: 'Documentation' }],
  },
]
