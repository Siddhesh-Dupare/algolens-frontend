<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type * as Monaco from 'monaco-editor'
import { usePlaybackStore } from '@/stores/playback.store'

const props = defineProps<{
  modelValue: string
  language?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const pb = usePlaybackStore()
const container = ref<HTMLDivElement>()
let editor: Monaco.editor.IStandaloneCodeEditor | undefined
let monacoRef: typeof Monaco | undefined
let decorations: Monaco.editor.IEditorDecorationsCollection | undefined

onMounted(async () => {
  await import('./monaco-setup')
  const monaco = await import('monaco-editor')
  monacoRef = monaco

  editor = monaco.editor.create(container.value!, {
    value: props.modelValue,
    language: props.language ?? 'plaintext',
    theme: 'vs-dark',
    automaticLayout: true,
    glyphMargin: true, // for the current-line ▶ marker
  })

  decorations = editor.createDecorationsCollection()

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue())
  })
})

// Highlight the line currently executing during debug playback, and scroll to it.
watch(
  () => pb.currentLine,
  (line) => {
    if (!editor || !decorations || !monacoRef) return
    if (line == null) {
      decorations.clear()
      return
    }
    decorations.set([
      {
        range: new monacoRef.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'debug-current-line',
          glyphMarginClassName: 'debug-current-line-glyph',
        },
      },
    ])
    editor.revealLineInCenter(line)
  },
)

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

<!-- Unscoped: Monaco renders decorations outside this component's DOM scope. -->
<style>
.debug-current-line {
  background: rgba(245, 158, 11, 0.15);
}
.debug-current-line-glyph::before {
  content: '▶';
  color: #f59e0b;
  margin-left: 4px;
}
</style>
