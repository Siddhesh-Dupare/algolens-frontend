<script setup lang="ts">
import { onMounted } from 'vue'
import TerminalTabs from './TerminalTabs.vue'
import TerminalInstance from './TerminalInstance.vue'
import { useTerminalStore } from '@/stores/terminal.store'
import { storeToRefs } from 'pinia'

const store = useTerminalStore()
const { sessions, activeSessionId } = storeToRefs(store)

onMounted(() => {
  if (sessions.value.length === 0) store.createSession() // open one by default
})
</script>

<template>
  <div class="h-full flex flex-col">
    <TerminalTabs />
    <div class="flex-1 relative">
      <TerminalInstance
        v-for="session in sessions"
        :key="session.id"
        v-show="session.id === activeSessionId"
        :session-id="session.id"
        class="absolute inset-0"
      />
    </div>
  </div>
</template>
