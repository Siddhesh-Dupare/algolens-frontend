<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { explorerVisible } = storeToRefs(layout)
</script>

<template>
  <div class="flex flex-col h-screen">
    <Menu />
    <ResizablePanelGroup direction="horizontal" class="flex-1 overflow-hidden">
      <template v-if="explorerVisible">
        <ResizablePanel :default-size="15" :min-size="10" :max-size="20">
          <FileExplorer />
        </ResizablePanel>
        <ResizableHandle with-handle />
      </template>

      <ResizablePanel :default-size="80">
        <main class="h-full overflow-auto" />
      </ResizablePanel>
    </ResizablePanelGroup>
    <BottomBar />
  </div>
</template>

<style scoped></style>
