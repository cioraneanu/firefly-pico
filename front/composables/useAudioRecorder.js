import { ref } from 'vue'
import UIUtils from '~/utils/UIUtils'

/**
 * Browser-native audio recorder using MediaRecorder API.
 * Records microphone audio as webm/opus blob for uploading to backend STT.
 *
 * Returns Promises so callers can await stopRecording() and get the actual blob.
 */
export function useAudioRecorder() {
  const isRecording = ref(false)
  const isSupported = ref(false)

  let mediaRecorder = null
  let audioChunks = []
  let stream = null
  let stopResolve = null
  let stopPromise = null

  // Check browser support
  const checkSupport = () => {
    isSupported.value = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
    return isSupported.value
  }

  const startRecording = async () => {
    if (!checkSupport()) {
      UIUtils.showToastError('Audio recording not supported in this browser.')
      return false
    }

    if (isRecording.value) {
      return false
    }

    audioChunks = []
    stopResolve = null
    stopPromise = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        UIUtils.showToastError('Microphone permission denied. Please allow microphone access.')
      } else if (err.name === 'NotFoundError') {
        UIUtils.showToastError('No microphone found. Please connect a microphone.')
      } else {
        UIUtils.showToastError(`Microphone error: ${err.message}`)
      }
      return false
    }

    // Prefer opus codec for smaller files, fallback to whatever the browser supports
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

    try {
      mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    } catch (err) {
      mediaRecorder = new MediaRecorder(stream)
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      isRecording.value = false
      // Stop all tracks to release the microphone
      stream?.getTracks().forEach((track) => track.stop())

      const mimeType = mediaRecorder?.mimeType || 'audio/webm'
      const blob = new Blob(audioChunks, { type: mimeType })
      console.log('[useAudioRecorder] onstop blob size:', blob.size, 'type:', blob.type)

      if (stopResolve) {
        stopResolve(blob)
      }
      audioChunks = []
      stopResolve = null
    }

    mediaRecorder.onerror = (event) => {
      UIUtils.showToastError(`Recording error: ${event.message || 'Unknown error'}`)
      stopRecording().catch(() => {})
    }

    mediaRecorder.start()
    isRecording.value = true
    return true
  }

  const stopRecording = () => {
    if (!isRecording.value || !mediaRecorder) {
      return Promise.resolve(null)
    }

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }

    // Create a promise that resolves when onstop fires
    stopPromise = new Promise((resolve) => {
      stopResolve = resolve
    })

    return stopPromise
  }

  // Check support on creation
  checkSupport()

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
  }
}
