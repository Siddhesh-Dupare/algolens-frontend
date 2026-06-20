<script setup lang="ts">
import { executionConfig } from './tab.data'
import { Button } from '@/components/ui/button'
import { X } from '@lucide/vue'
import { useTabsStore } from '@/stores/tabs.store'
import { storeToRefs } from 'pinia'

const tabsStore = useTabsStore()
const { tabs, activeTabId } = storeToRefs(tabsStore)
</script>

<template>
  <div class="flex justify-between items-center border-b">
    <div class="flex flex-1 overflow-x-auto">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-3 py-1.5 text-sm border-r cursor-pointer"
        :class="tab.id === activeTabId ? 'bg-accent text-foreground' : 'text-muted-foreground'"
        @click="tabsStore.setActiveTab(tab.id)"
      >
        <span>{{ tab.name }}</span>
        <X class="size-3.5 hover:text-foreground" @click.stop="tabsStore.closeTab(tab.id)" />
      </div>
    </div>
    <div class="flex gap-2 px-2">
      <Button
        variant="outline"
        size="sm"
        class="cursor-pointer"
        v-for="execution in executionConfig"
        :key="execution.id"
        :aria-label="execution.label"
        @click="execution.action?.()"
      >
        <component :is="execution.symbol" />
      </Button>
    </div>
  </div>
</template>
