import { ref } from 'vue'
import UIUtils from '~/utils/UIUtils'
import * as LanguageConstants from '~/constants/LanguageConstants'

// by convention, composable function names start with "use"
export function useSpeechRecognition({ language, onSpeechFinished }) {
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
    speechRecognition.lang = language.value.code
    startRecording()
  })

  const startRecording = () => {
    if (!speechRecognition) {
      registerMic()
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
    if ('webkitSpeechRecognition' in window) {
      // Initialize webkitSpeechRecognition
      speechRecognition = new webkitSpeechRecognition()
      // speechRecognition = new SpeechRecognition()

      // String for the Final Transcript

      // Set the properties for the Speech Recognition object
      // speechRecognition.continuous = true
      // speechRecognition.interimResults = true

      speechRecognition.continuous = false
      speechRecognition.interimResults = false
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
        var transcript = event.results[0][0].transcript
        if (onSpeechFinished) {
          onSpeechFinished(transcript)
        }

        // // Create the interim transcript string locally because we don't want it to persist like final transcript
        // textTemporary.value = ''
        // // Loop through the results from the speech recognition object.
        // for (let i = event.resultIndex; i < event.results.length; ++i) {
        //   // If the result item is Final, add it to Final Transcript, Else add it to Interim transcript
        //   if (event.results[i].isFinal) {
        //     let finalText = event.results[i][0].transcript
        //     if (onSpeechFinished) {
        //       onSpeechFinished(finalText)
        //     }
        //     textFinal.value = finalText
        //     // speechText.value += event.results[i][0].transcript;
        //   } else {
        //     textTemporary.value += event.results[i][0].transcript
        //   }
        // }
      }
    } else {
      UIUtils.showToastError('Speech recognisition not available. Please use a different browser...')
    }
  }

  return { registerMic, startRecording, stopRecording, isRecording, textTemporary, textFinal }
}
