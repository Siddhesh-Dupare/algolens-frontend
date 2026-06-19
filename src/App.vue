<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'
import Terminal from '@/components/terminal/Terminal.vue'
import Visualizer from '@/components/visualizer/Visualizer.vue'
import Tabs from '@/components/tabs/Tabs.vue'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { explorerVisible, terminalVisible, visualizerVisible } = storeToRefs(layout)
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
            <div class="flex flex-col">
              <!-- Editor Tabs -->
              <Tabs />
              <!-- Main Editor -->
              <main class="h-full overflow-auto" />
            </div>
          </ResizablePanel>
          <!-- Terminal Panel -->
          <ResizableHandle with-handle />
          <template v-if="terminalVisible">
            <ResizablePanel :default-size="25" :min-size="10">
              <Terminal class="h-full overflow-auto" />
            </ResizablePanel>
          </template>
        </ResizablePanelGroup>
      </ResizablePanel>
      <!-- Visualizer Panel -->
      <template v-if="visualizerVisible">
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="20" :min-size="10">
          <Visualizer />
        </ResizablePanel>
      </template>
    </ResizablePanelGroup>
    <!-- Bottom Bar -->
    <BottomBar />
  </div>
</template>

<style scoped></style>
