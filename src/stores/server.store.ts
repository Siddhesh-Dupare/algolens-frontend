import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ClientMessage, ServerMessage } from '@/types/server-protocol'
import { notifyError } from '@/lib/notify'

export const useServerStore = defineStore('server', () => {
  const socket = ref<WebSocket | null>(null)
  const connected = ref(false)
  const listeners = new Set<(msg: ServerMessage) => void>()

  function connect() {
    if (socket.value) return
    const ws = new WebSocket('ws://localhost:3001')

    ws.onopen = () => {
      connected.value = true
    }
    ws.onclose = () => {
      connected.value = false
      socket.value = null
    }
    ws.onerror = (e) => {
      console.error('[server] socket error', e)
      notifyError(
        'Execution server unavailable',
        'Could not reach the AlgoLens server on port 3001.',
        'server-3001',
      )
    }
    ws.onmessage = (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data) as ServerMessage
      } catch {
        return
      }
      // Surface backend execution/trace errors as a toast.
      if (msg.type === 'error') {
        notifyError(`Error: ${msg.errorType ?? 'execution'}`, msg.message)
      }
      listeners.forEach((fn) => fn(msg))
    }

    socket.value = ws
  }

  function send(msg: ClientMessage) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(msg))
    } else if (socket.value?.readyState === WebSocket.CONNECTING) {
      socket.value.addEventListener('open', () => socket.value!.send(JSON.stringify(msg)), {
        once: true,
      })
    } else {
      console.warn('[server] socket not open, dropping message', msg)
    }
  }

  function onMessage(fn: (msg: ServerMessage) => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  return { connected, connect, send, onMessage }
})
