<script setup lang="ts">
import { ScrollArea } from '@/components/ui/scroll-area'
import { Empty, EmptyHeader, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import ExplorerNode from './ExplorerNode.vue'
import { useExplorerStore } from '@/stores/explorer.store'
import { storeToRefs } from 'pinia'

const store = useExplorerStore()
const { fileTree, rootName } = storeToRefs(store)
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- header -->
    <div
      class="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider flex justify-between items-center"
    >
      {{ rootName || 'Explorer' }}
    </div>

    <!-- empty state -->
    <div
      v-if="!fileTree.length"
      class="flex flex-col items-center justify-center flex-1 gap-2 text-sm"
    >
      <Empty>
        <EmptyHeader>
          <EmptyDescription class="text-base">
            Choose the option below to use the project panel
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button class="cursor-pointer" variant="outline" @click="store.openFolder()">
            Open Folder
          </Button>
        </EmptyContent>
      </Empty>
    </div>

    <ScrollArea v-else class="flex-1">
      <ExplorerNode v-for="node in fileTree" :key="node.id" :node="node" />
    </ScrollArea>
  </div>
</template>
