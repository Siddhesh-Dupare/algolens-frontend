<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from '@lucide/vue'
import { usePlaybackStore } from '@/stores/playback.store'

const pb = usePlaybackStore()
const vizPanel = ref<HTMLElement | null>(null)

function query(payload: object) {
  const cefQuery = (window as any).cefQuery
  if (!cefQuery) return
  cefQuery({ request: JSON.stringify(payload), onSuccess: () => {}, onFailure: () => {} })
}

// Show the renderer at the panel's current rectangle (the flex-1 area only, so
// the controls bar below is never covered by the native window).
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

function hideRenderer() {
  query({ type: 'bounds', x: 0, y: 0, w: 0, h: 0 })
}

let settleTimer: number | undefined
let hidden = false

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
  timers = [300, 800, 1500, 3000].map((t) => window.setTimeout(sendBounds, t))

  ro = new ResizeObserver(() => {
    if (firstObserve) {
      firstObserve = false
      return
    }
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
  hideRenderer() // hide the docked renderer when the panel closes
})
</script>

<template>
  <div class="flex h-full w-full flex-col bg-[#0a0a0c]">
    <!-- The docked SDL renderer overlays THIS area only. -->
    <div ref="vizPanel" class="min-h-0 flex-1"></div>

    <!-- Playback controls — below the renderer, never covered. -->
    <div
      class="flex h-12 flex-shrink-0 items-center justify-center gap-3 border-t border-neutral-800 text-neutral-200"
    >
      <button
        class="rounded p-1 hover:bg-neutral-700 disabled:opacity-40"
        :disabled="pb.frames.length === 0 || pb.index === 0"
        title="Step back"
        @click="pb.stepBackward()"
      >
        <SkipBack :size="18" />
      </button>

      <button
        class="rounded p-1 hover:bg-neutral-700 disabled:opacity-40"
        :disabled="pb.frames.length === 0"
        :title="pb.isPlaying ? 'Pause' : 'Play'"
        @click="pb.togglePlay()"
      >
        <Pause v-if="pb.isPlaying" :size="18" />
        <Play v-else :size="18" />
      </button>

      <button
        class="rounded p-1 hover:bg-neutral-700 disabled:opacity-40"
        :disabled="pb.frames.length === 0 || pb.index >= pb.frames.length - 1"
        title="Step forward"
        @click="pb.stepForward()"
      >
        <SkipForward :size="18" />
      </button>

      <span class="ml-2 text-xs text-neutral-400">
        {{ pb.frames.length ? pb.index + 1 : 0 }} / {{ pb.frames.length }}
      </span>
    </div>
  </div>
</template>
