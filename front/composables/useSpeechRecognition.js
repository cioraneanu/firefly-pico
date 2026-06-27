import { ref } from 'vue'
import UIUtils from '~/utils/UIUtils'
import * as LanguageConstants from '~/constants/LanguageConstants'

// Legacy. No longer necessary since we can use the phone's dictation
export function useSpeechRecognition({ language, onSpeechFinished, onSpeechTemporary, continuous = false, interimResults = false } = {}) {
  // state encapsulated and managed by the composable

  let speechRecognition = null

  const isRecording = ref(false)
  const textTemporary = ref('')
  const textFinal = ref('')

  watch(language, async () => {
    if (!language.value) {
      return
    }

    stopRecording()
    textTemporary.value = ''
    textFinal.value = ''
    await sleep(500)
    if (!speechRecognition) {
      return
    }
    speechRecognition.lang = language.value.code
    startRecording()
  })

  const startRecording = () => {
    if (!speechRecognition) {
      registerMic()
    }
    if (!speechRecognition) {
      return
    }
    if (isRecording.value) {
      return
    }
    speechRecognition.start()
  }
  const stopRecording = () => {
    if (!isRecording.value) {
      return
    }
    speechRecognition.stop()
  }

  const registerMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      speechRecognition = new SpeechRecognition()

      speechRecognition.continuous = continuous
      speechRecognition.interimResults = interimResults
      speechRecognition.lang = language.value.code ?? LanguageConstants.LANGUAGE_ENGLISH

      // Callback Function for the onStart Event
      speechRecognition.onstart = () => {
        isRecording.value = true
        // Show the Status Element
        // document.querySelector("#status").style.display = "block";
      }
      speechRecognition.onerror = () => {
        isRecording.value = false
      }
      speechRecognition.onend = () => {
        isRecording.value = false
      }

      speechRecognition.onresult = (event) => {
        textTemporary.value = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            textFinal.value += transcript
            onSpeechFinished?.(transcript)
          } else {
            textTemporary.value += transcript
          }
        }

        onSpeechTemporary?.(textTemporary.value)
      }
    } else {
      UIUtils.showToastError('Speech recognition not available. Please use a different browser...')
    }
  }

  return { registerMic, startRecording, stopRecording, isRecording, textTemporary, textFinal }
}
