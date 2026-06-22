import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Holds the captured IR frames for one Debug run and drives playback. Whenever
// the current index changes, the active frame's IR is pushed to the renderer.
export const usePlaybackStore = defineStore('playback', () => {
  const frames = ref<object[]>([])
  const lines = ref<number[]>([]) // source line per frame (for the editor highlight)
  const index = ref(0)
  const isPlaying = ref(false)
  let timer: number | undefined

  // The source line executing at the current frame (null when not playing).
  const currentLine = computed(() => lines.value[index.value] ?? null)

  function sendCurrent() {
    const f = frames.value[index.value]
    if (f && window.cefQuery) {
      window.cefQuery({
        request: JSON.stringify(f),
        onSuccess: () => {},
        onFailure: () => {},
      })
    }
  }

  // Load a fresh run's frames and show the first one.
  function setFrames(items: { ir: object; line: number }[]) {
    pause()
    frames.value = items.map((it) => it.ir)
    lines.value = items.map((it) => it.line)
    index.value = 0
    sendCurrent()
  }

  function stepForward() {
    if (index.value < frames.value.length - 1) {
      index.value++
      sendCurrent()
    } else {
      pause() // reached the end
    }
  }

  function stepBackward() {
    if (index.value > 0) {
      index.value--
      sendCurrent()
    }
  }

  function play() {
    if (isPlaying.value || frames.value.length === 0) return
    isPlaying.value = true
    timer = window.setInterval(() => {
      if (index.value >= frames.value.length - 1) {
        pause()
        return
      }
      stepForward()
    }, 600) // ms per frame
  }

  function pause() {
    isPlaying.value = false
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  return {
    frames,
    index,
    isPlaying,
    currentLine,
    setFrames,
    stepForward,
    stepBackward,
    play,
    pause,
    togglePlay,
  }
})
