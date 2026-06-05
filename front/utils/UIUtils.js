export default class UIUtils {

  static showToastSuccess(message, duration = 1000) {
    const instance = showNotify({
      type: 'success',
      message: message,
      duration: duration,
      onClick: (event) => {
        instance?.close()
      },
    })
  }

  static showToastError(message, duration = 3000) {
    const instance = showNotify({
      type: 'danger',
      message: message,
      duration: duration,
      onClick: (event) => {
        instance?.close()
      },
    })
  }


  static async showDeleteConfirmation(title, message) {
    return new Promise((resolve, reject) => {
      showConfirmDialog({
        title: title,
        message: message,
      })
        .then(() => resolve(true))
        .catch(() => resolve(false))
    })
  }

}

