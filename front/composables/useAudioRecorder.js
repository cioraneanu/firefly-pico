import { ref } from 'vue'
import UIUtils from '~/utils/UIUtils'

/**
 * Browser-native audio recorder using MediaRecorder API.
 * Records microphone audio as webm/opus blob for uploading to backend STT.
 */
export function useAudioRecorder() {
  const isRecording = ref(false)
  const isSupported = ref(false)

  let mediaRecorder = null
  let audioChunks = []
  let stream = null

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
      // Fallback without specifying mimeType
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
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorder.onerror = (event) => {
      UIUtils.showToastError(`Recording error: ${event.message || 'Unknown error'}`)
      stopRecording()
    }

    mediaRecorder.start()
    isRecording.value = true
    return true
  }

  const stopRecording = () => {
    if (!isRecording.value || !mediaRecorder) {
      return null
    }

    mediaRecorder.stop()
    isRecording.value = false

    const mimeType = mediaRecorder.mimeType || 'audio/webm'
    const blob = new Blob(audioChunks, { type: mimeType })
    audioChunks = []

    return blob
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
