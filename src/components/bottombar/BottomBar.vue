<script setup lang="ts">
import { Toggle } from '@/components/ui/toggle'
import { stripLeftConfig, stripRightConfig } from './bottom.bar'
</script>

<template>
  <div class="flex justify-between items-center border-t">
    <div class="flex">
      <Toggle
        variant="ghost"
        class="rounded-none cursor-pointer"
        v-for="stripLeft in stripLeftConfig"
        :key="stripLeft.id"
      >
        <component :is="stripLeft.symbol" />
      </Toggle>
    </div>
    <div class="flex">
      <Toggle
        variant="ghost"
        class="rounded-none cursor-pointer"
        v-for="stripRight in stripRightConfig"
        :key="stripRight.id"
      >
        <component :is="stripRight.symbol" />
      </Toggle>
    </div>
  </div>
</template>
