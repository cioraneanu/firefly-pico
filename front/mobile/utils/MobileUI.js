import { useMobileFeedback } from '~/mobile/composables/useMobileFeedback'

export default {
  toast: (message, type, duration) => useMobileFeedback().pushToast(message, type, duration),

  confirm: (title, message) => useMobileFeedback().askConfirm(title, message),
}
