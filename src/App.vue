<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'
import Terminal from '@/components/terminal/Terminal.vue'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { explorerVisible, terminalVisible } = storeToRefs(layout)
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header Menu -->
    <Menu />
    <ResizablePanelGroup direction="horizontal" class="flex-1 overflow-hidden">
      <!-- File Explorer -->
      <template v-if="explorerVisible">
        <ResizablePanel :default-size="15" :min-size="10" :max-size="20">
          <FileExplorer />
        </ResizablePanel>
        <ResizableHandle with-handle />
      </template>
      <!-- Main Window -->
      <ResizablePanel :default-size="80">
        <ResizablePanelGroup direction="vertical" class="flex-1 overflow-hidden">
          <ResizablePanel :default-size="80">
            <main class="h-full overflow-auto" />
          </ResizablePanel>
          <ResizableHandle with-handle />
          <template v-if="terminalVisible">
            <ResizablePanel :default-size="20" :min-size="10">
              <Terminal class="h-full overflow-auto" />
            </ResizablePanel>
          </template>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
    <!-- Bottom Bar -->
    <BottomBar />
  </div>
</template>

<style scoped></style>
