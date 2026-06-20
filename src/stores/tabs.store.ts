import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type EditorTab = {
  id: string
  name: string
  language: string
  content: string
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<EditorTab[]>([])
  const activeTabId = ref<string | null>(null)

  const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value) ?? null)

  function openTab(tab: EditorTab) {
    if (!tabs.value.some((t) => t.id === tab.id)) tabs.value.push(tab)
    activeTabId.value = tab.id
  }

  function closeTab(id: string) {
    const index = tabs.value.findIndex((t) => t.id === id)
    if (index === -1) return
    tabs.value.splice(index, 1)
    if (activeTabId.value === id) {
      activeTabId.value = tabs.value[index]?.id ?? tabs.value[index - 1]?.id ?? null
    }
  }

  function setActiveTab(id: string) {
    activeTabId.value = id
  }

  return { tabs, activeTabId, activeTab, openTab, closeTab, setActiveTab }
})
