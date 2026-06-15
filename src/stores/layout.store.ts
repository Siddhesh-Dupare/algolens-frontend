import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const explorerVisible = ref(true)

  function toggleExplorer() {
    explorerVisible.value = !explorerVisible.value
  }

  return { explorerVisible, toggleExplorer }
})
