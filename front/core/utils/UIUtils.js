export default class UIUtils {
  static ui = { toast: () => null, confirm: async () => false }

  static showToastSuccess(message, duration = 1000) {
    return UIUtils.showToast(message, 'success', duration)
  }

  // A form saved: the mobile app flashes a line under its header (ui.saved), the desktop app shows a toast
  static showSaveSuccess(message) {
    return UIUtils.ui.saved ? UIUtils.ui.saved() : UIUtils.showToastSuccess(message)
  }

  static showToastError(message, duration = 3000) {
    return UIUtils.showToast(message, 'danger', duration)
  }

  // options: { action: { label, icon, onClick }, onClose } => returns { close }
  static showToast(message, type, duration, options = {}) {
    return UIUtils.ui.toast(message, type, duration, options)
  }

  static showDeleteConfirmation(title, message) {
    return UIUtils.ui.confirm(title, message)
  }
}
