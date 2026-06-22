<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { useTerminalStore } from '@/stores/terminal.store'
import { storeToRefs } from 'pinia'

const store = useTerminalStore()
const { sessions, activeSessionId } = storeToRefs(store)
</script>

<template>
  <div class="flex items-center border-b">
    <div class="flex flex-1 overflow-x-auto">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="flex items-center gap-2 px-3 py-1 text-sm border-r cursor-pointer"
        :class="
          session.id === activeSessionId ? 'bg-accent text-foreground' : 'text-muted-foreground'
        "
        @click="store.setActiveSession(session.id)"
      >
        <span>{{ session.name }}</span>
        <X class="size-3.5 hover:text-foreground" @click.stop="store.closeSession(session.id)" />
      </div>
    </div>
    <button class="px-2 cursor-pointer" @click="store.createSession()">
      <Plus class="size-4" />
    </button>
  </div>
</template>
