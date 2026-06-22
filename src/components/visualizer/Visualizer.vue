<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const vizPanel = ref<HTMLElement | null>(null)

function query(payload: object) {
  const cefQuery = (window as any).cefQuery
  if (!cefQuery) return
  cefQuery({ request: JSON.stringify(payload), onSuccess: () => {}, onFailure: () => {} })
}

// Show the renderer at the panel's current rectangle.
function sendBounds() {
  if (!vizPanel.value) return
  const r = vizPanel.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  query({
    type: 'bounds',
    x: Math.round(r.left * dpr),
    y: Math.round(r.top * dpr),
    w: Math.round(r.width * dpr),
    h: Math.round(r.height * dpr),
  })
}

// Hide it (zero size) — the panel's dark background covers the area.
function hideRenderer() {
  query({ type: 'bounds', x: 0, y: 0, w: 0, h: 0 })
}

let settleTimer: number | undefined
let hidden = false

// While resizing: hide once, then snap to the final bounds ~120ms after it stops.
function onResize() {
  if (!hidden) {
    hideRenderer()
    hidden = true
  }
  clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => {
    hidden = false
    sendBounds()
  }, 120)
}

let ro: ResizeObserver | undefined
let firstObserve = true
let timers: number[] = []

onMounted(() => {
  sendBounds()
  // resend while the renderer finishes docking (it polls for up to ~10s)
  timers = [300, 800, 1500, 3000].map((t) => window.setTimeout(sendBounds, t))

  ro = new ResizeObserver(() => {
    if (firstObserve) {
      firstObserve = false
      return
    } // skip initial fire
    onResize()
  })
  if (vizPanel.value) ro.observe(vizPanel.value)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  clearTimeout(settleTimer)
  ro?.disconnect()
  window.removeEventListener('resize', onResize)
  // Hide the docked renderer when the panel closes, so it doesn't float.
  hideRenderer()
})
</script>

<template>
  <!-- bg matches the renderer's clear color, so hiding is seamless -->
  <div ref="vizPanel" class="w-full h-full bg-[#0a0a0c]"></div>
</template>
