import { showConfirmDialog, showNotify } from 'vant'

export default {
  toast(message, type, duration) {
    const instance = showNotify({ type, message, duration, className: 'app-toast', onClick: () => instance?.close() })
    return instance
  },

  confirm: (title, message) =>
    showConfirmDialog({ title, message })
      .then(() => true)
      .catch(() => false),
}
