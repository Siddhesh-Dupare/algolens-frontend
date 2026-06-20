import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileNode } from '@/components/explorer/explorer.data'

export const useExplorerStore = defineStore('explorer', () => {
  const fileTree = ref<FileNode[]>([])
  const rootName = ref<string>('')

  async function openFolder() {
    // Web file system access api
    const dir = await window.showDirectoryPicker()
    rootName.value = dir.name
    fileTree.value = await buildTree(dir)
  }

  async function buildTree(dir: FileSystemDirectoryHandle, depth = 0): Promise<FileNode[]> {
    const nodes: FileNode[] = []
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === 'directory') {
        nodes.push({
          id: `${depth}-${name}`,
          name,
          type: 'folder',
          children: await buildTree(handle as FileSystemDirectoryHandle, depth + 1),
        })
      } else {
        nodes.push({
          id: `${depth}-${name}`,
          name,
          type: 'file',
          handle: handle as FileSystemFileHandle,
        })
      }
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  return { fileTree, rootName, openFolder }
})
