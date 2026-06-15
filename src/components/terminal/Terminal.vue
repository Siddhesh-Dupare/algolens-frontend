<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const container = ref<HTMLDivElement>()

let terminal: Terminal
let fitAddon: FitAddon
let resizeObserver: ResizeObserver
let resizeTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'Consolas, monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#cccccc',
    },
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(container.value!)
  fitAddon.fit()

  // resize terminal when panel resizes
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => fitAddon.fit(), 50)
  })
  resizeObserver.observe(container.value!)

  // send keystrokes to c++ backend via CEF IPC
  // terminal.onData((data) => {
  //   window.cef?.sendInput(data)
  // })
  //
  // receive output from c++ backend
  // window.cef?.onOutput((data: string) => terminal.write(data))
})

onUnmounted(() => {
  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
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
