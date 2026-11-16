import { useNow } from '@vueuse/core'

// Bridge to the iOS app (ios/), which runs this web app in a WKWebView.
// Web → iOS: window.webkit.messageHandlers.pico.postMessage({ action, ...payload })
// iOS → web: a `pico-native` event on window, detail { type: 'recording', state: 'idle' | 'recording' | 'saved', startedAt }
const handler = window.webkit?.messageHandlers?.pico
export const isNativeApp = !!handler

export const postToNative = (action, payload = {}) => handler?.postMessage({ action, ...payload })

const recording = ref({ state: 'idle', startedAt: null })
let savedTimer = null
if (isNativeApp) {
  window.addEventListener('pico-native', ({ detail }) => {
    if (detail?.type !== 'recording') return
    recording.value = detail
    // 'saved' is a short confirmation, then back to the mic
    clearTimeout(savedTimer)
    if (detail.state === 'saved') savedTimer = setTimeout(() => (recording.value = { state: 'idle', startedAt: null }), 2200)
  })
  // Asks the app for the current recording state (a recording may already be running)
  postToNative('ready')
}

export function useNativeApp() {
  const now = useNow({ interval: 1000 })
  const recordingTime = computed(() => {
    const seconds = Math.max(0, Math.floor((now.value - recording.value.startedAt) / 1000))
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  })

  return {
    isNativeApp,
    recording,
    recordingTime,
    toggleRecording: () => postToNative('toggleRecording'),
    openRecorder: () => postToNative('openRecorder'),
  }
}
