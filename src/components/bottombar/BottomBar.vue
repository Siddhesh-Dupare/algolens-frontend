<script setup lang="ts">
import { Toggle } from '@/components/ui/toggle'
import { stripLeftConfig, stripRightConfig, languageLabels } from './bottom.bar'

import { useLayoutStore } from '@/stores/layout.store'
import { useTabsStore } from '@/stores/tabs.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { explorerVisible, terminalVisible, visualizerVisible } = storeToRefs(layout)

const tabsStore = useTabsStore()
const { activeTab } = storeToRefs(tabsStore)

function getPressedState(id: string): boolean {
  if (id === 'tree-list') return explorerVisible.value
  if (id === 'terminal-panel') return terminalVisible.value
  if (id === 'visualizer-panel') return visualizerVisible.value
  return false
}
</script>

<template>
  <div class="flex justify-between items-center border-t">
    <div class="flex">
      <Toggle
        class="Toggle rounded-none cursor-pointer"
        v-for="stripLeft in stripLeftConfig"
        :key="stripLeft.id"
        :pressed="getPressedState(stripLeft.id)"
        :data-state="getPressedState(stripLeft.id) ? 'on' : 'off'"
        :aria-label="stripLeft.label"
        @click="stripLeft.action?.()"
      >
        <component :is="stripLeft.symbol" />
      </Toggle>
    </div>
    <div class="flex items-center gap-1">
      <span v-if="activeTab" class="px-2 text-muted-foreground">
        {{ languageLabels[activeTab.language] ?? activeTab.language }}
      </span>
      <Toggle
        class="rounded-none cursor-pointer"
        v-for="stripRight in stripRightConfig"
        :key="stripRight.id"
        :pressed="getPressedState(stripRight.id)"
        :data-state="getPressedState(stripRight.id) ? 'on' : 'off'"
        :aria-label="stripRight.label"
        @click="stripRight.action?.()"
      >
        <component :is="stripRight.symbol" />
      </Toggle>
    </div>
  </div>
</template>
