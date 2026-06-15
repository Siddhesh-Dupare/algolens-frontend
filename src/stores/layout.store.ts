import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const explorerVisible = ref(true)
  const terminalVisible = ref(true)

  function toggleExplorer() {
    explorerVisible.value = !explorerVisible.value
  }

  function toggleTerminal() {
    terminalVisible.value = !terminalVisible.value
  }

  return { explorerVisible, toggleExplorer, terminalVisible, toggleTerminal }
})
