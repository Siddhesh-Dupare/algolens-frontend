<script setup lang="ts">
import { executionConfig } from './tab.data'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex justify-between items-center border-b">
    <div class="flex-1"></div>
    <div class="flex gap-2">
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
