import { showConfirmDialog, showNotify } from 'vant'

export default class UIUtils {
  static toastClassName = 'app-toast'

  static toastTypes = {
    success: 'success',
    error: 'danger',
  }

  static showToastSuccess(message, duration = 1000) {
    return UIUtils.showToast(message, UIUtils.toastTypes.success, duration)
  }

  static showToastError(message, duration = 3000) {
    return UIUtils.showToast(message, UIUtils.toastTypes.error, duration)
  }

  static showToast(message, type, duration) {
    const instance = showNotify({
      type,
      message,
      duration,
      className: UIUtils.toastClassName,
      onClick: () => {
        instance?.close()
      },
    })

    return instance
  }

  static async showDeleteConfirmation(title, message) {
    return showConfirmDialog({
      title,
      message,
    })
      .then(() => true)
      .catch(() => false)
  }
}
