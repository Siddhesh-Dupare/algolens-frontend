<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'
import Terminal from '@/components/terminal/Terminal.vue'
import Visualizer from '@/components/visualizer/Visualizer.vue'
import Tabs from '@/components/tabs/Tabs.vue'
import MonacoEditor from '@/components/editor/MonacoEditor.vue'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

import { useTabsStore } from '@/stores/tabs.store'
import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const tabsStore = useTabsStore()
const { explorerVisible, terminalVisible, visualizerVisible } = storeToRefs(layout)
const { activeTab } = storeToRefs(tabsStore)
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
            <div class="flex flex-col h-full overflow-hidden">
              <!-- Editor Tabs -->
              <Tabs />
              <!-- Main Editor -->
              <main class="flex-1 overflow-hidden">
                <MonacoEditor
                  v-if="activeTab"
                  :key="activeTab.id"
                  v-model="activeTab.content"
                  :language="activeTab.language"
                />
                <div
                  v-else
                  class="h-full flex items-center justify-center text-muted-foreground text-sm"
                >
                  No file open
                </div>
              </main>
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
