<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{ sessionId: string }>()

const container = ref<HTMLDivElement>()
let terminal: Terminal
let fitAddon: FitAddon
let webSocket: WebSocket
let resizeObserver: ResizeObserver
let resizeTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'Consolas, monospace',
    theme: { background: '#1e1e1e', foreground: '#cccccc', cursor: '#cccccc' },
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(container.value!)
  fitAddon.fit()

  webSocket = new WebSocket('ws://127.0.0.1:3002')

  webSocket.onopen = () =>
    webSocket.send(
      JSON.stringify({
        type: 'init',
        sessionId: props.sessionId,
        cols: terminal.cols,
        rows: terminal.rows,
      }),
    )

  webSocket.onmessage = (e) => {
    if (typeof e.data === 'string') terminal.write(e.data)
    else terminal.write(new Uint8Array(e.data))
  }

  terminal.onData((data) => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({ type: 'input', sessionId: props.sessionId, data }))
    }
  })

  const doFit = () => {
    fitAddon.fit()
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(
        JSON.stringify({
          type: 'resize',
          sessionId: props.sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        }),
      )
    }
  }

  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(doFit, 50)
  })
  resizeObserver.observe(container.value!)
})

onUnmounted(() => {
  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  webSocket?.send(JSON.stringify({ type: 'close', sessionId: props.sessionId }))
  webSocket?.close()
  terminal?.dispose()
})
</script>

<template>
  <div ref="container" class="h-full w-full"></div>
</template>

<style scoped>
:deep(.xterm) {
  padding: 0;
  height: 100%;
}
:deep(.xterm-viewport) {
  border-radius: 0;
}
</style>
