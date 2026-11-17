export default class UIUtils {
  static ui = { toast: () => null, confirm: async () => false }

  static showToastSuccess(message, duration = 1000) {
    return UIUtils.showToast(message, 'success', duration)
  }

  static showToastError(message, duration = 3000) {
    return UIUtils.showToast(message, 'danger', duration)
  }

  // options: { action: { label, onClick }, onClose } => returns { close }
  static showToast(message, type, duration, options = {}) {
    return UIUtils.ui.toast(message, type, duration, options)
  }

  static showDeleteConfirmation(title, message) {
    return UIUtils.ui.confirm(title, message)
  }
}
