import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TerminalSession = {
  id: string
  name: string
}

export const useTerminalStore = defineStore('terminal', () => {
  const sessions = ref<TerminalSession[]>([])
  const activeSessionId = ref<string | null>(null)

  function createSession() {
    const id = crypto.randomUUID()
    sessions.value.push({ id, name: `Terminal ${sessions.value.length + 1}` })
    activeSessionId.value = id
    console.log('createSession called, new length:', sessions.value.length)
  }

  function closeSession(id: string) {
    const index = sessions.value.findIndex((s) => s.id === id)
    if (index === -1) return
    sessions.value.splice(index, 1)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[index]?.id ?? sessions.value[index - 1]?.id ?? null
    }
  }

  function setActiveSession(id: string) {
    activeSessionId.value = id
  }

  return { sessions, activeSessionId, createSession, closeSession, setActiveSession }
})
