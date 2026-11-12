// Toasts and the confirm alert of the mobile app. State lives at module level so UIUtils (core) can push to it
// and <app-feedback-host> renders it inside the .mx root.
const toasts = ref([])
const confirmState = ref(null)
let seq = 0

export function useMobileFeedback() {
  const pushToast = (message, type = 'success', duration = 2000, { action = null, onClose = null } = {}) => {
    const id = ++seq
    const close = () => {
      if (!toasts.value.some((item) => item.id === id)) {
        return
      }
      toasts.value = toasts.value.filter((item) => item.id !== id)
      onClose?.()
    }
    const onAction = () => {
      action.onClick()
      close()
    }
    // One toast at a time (design): a new one replaces (closes) the current one
    toasts.value.forEach((toast) => toast.close())
    toasts.value = [{ id, message, type, action, duration, onAction, close }]
    if (duration > 0) {
      setTimeout(close, duration)
    }
    return { close }
  }

  const askConfirm = (title, message, { confirmText = null, danger = true } = {}) =>
    new Promise((resolve) => {
      confirmState.value = { title, message, confirmText, danger, resolve }
    })

  const answerConfirm = (value) => {
    confirmState.value?.resolve(value)
    confirmState.value = null
  }

  return { toasts, confirmState, pushToast, askConfirm, answerConfirm }
}
