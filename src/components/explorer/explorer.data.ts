import { FileCode, FileText } from '@lucide/vue'

import type { Component } from 'vue'

export type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  icon?: Component
  children?: FileNode[]
}

export const fileTree: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: '3',
            name: 'App.vue',
            type: 'file',
            icon: FileCode,
          },
          { id: '4', name: 'README.md', type: 'file', icon: FileText },
        ],
      },
    ],
  },
]
