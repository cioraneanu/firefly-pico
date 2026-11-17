import { useMobileFeedback } from '~/mobile/composables/useMobileFeedback'

export default {
  toast: (message, type, duration, options) => useMobileFeedback().pushToast(message, type, duration, options),

  confirm: (title, message) => useMobileFeedback().askConfirm(title, message),
}
