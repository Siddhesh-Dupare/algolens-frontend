<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import './monaco-setup'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
  language?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const container = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneCodeEditor

onMounted(() => {
  editor = monaco.editor.create(container.value!, {
    value: props.modelValue,
    language: props.language ?? 'plaintext',
    theme: 'vs-dark',
    automaticLayout: true,
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue())
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue)
    }
  },
)

onUnmounted(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>
