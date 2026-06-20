<script setup lang="ts">
import { ref } from 'vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Folder, FolderOpen, ChevronRight, ChevronDown, File } from '@lucide/vue'
import type { FileNode } from './explorer.data'
import { useTabsStore } from '@/stores/tabs.store'

const props = defineProps<{ node: FileNode; depth?: number }>()
const open = ref(false)
const tabsStore = useTabsStore()
const indent = (props.depth ?? 0) * 12

const languageMap: Record<string, string> = {
  js: 'javascript',
  java: 'java',
  c: 'cpp',
  cpp: 'cpp',
  cc: 'cpp',
  py: 'python',
}

function detectLanguage(name: string) {
  const ext = name.split('.').pop() ?? ''
  return languageMap[ext] ?? 'plaintext'
}

async function openFile() {
  const file = await props.node.handle?.getFile()
  const content = file ? await file.text() : ''

  tabsStore.openTab({
    id: props.node.id,
    name: props.node.name,
    language: detectLanguage(props.node.name),
    content,
  })
}
</script>

<template>
  <Collapsible v-if="node.type === 'folder'" v-model:open="open">
    <CollapsibleTrigger
      class="flex items-center gap-1 w-full px-2 py-0.5 text-sm hover:bg-accent cursor-pointer"
      :style="{ paddingLeft: `${indent + 8}px` }"
    >
      <ChevronDown v-if="open" class="size-3 shrink-0" />
      <ChevronRight v-else class="size-3 shrink-0" />
      <FolderOpen v-if="open" class="size-4 shrink-0" />
      <Folder v-else class="size-4 shrink-0" />
      <span class="truncate">{{ node.name }}</span>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <ExplorerNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="(depth ?? 0) + 1"
      />
    </CollapsibleContent>
  </Collapsible>

  <!-- FILE -->
  <div
    v-else
    class="flex items-center gap-1.5 w-full px-2 py-0.5 text-sm hover:bg-accent cursor-pointer"
    :style="{ paddingLeft: `${indent + 20}px` }"
    @click="openFile"
  >
    <component :is="node.icon ?? File" class="size-4 shrink-0 text-muted-foreground" />
    <span class="truncate">{{ node.name }}</span>
  </div>
</template>
