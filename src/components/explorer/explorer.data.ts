import { FileCode, FileText } from '@lucide/vue'

import type { Component } from 'vue'

export type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  icon?: Component
  children?: FileNode[]
  handle?: FileSystemFileHandle
}
