export default class UIUtils {
  static showToast(text, duration = 3000) {}

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

  static showToastLoading(message = "Loading...") {
    const loadingStore = useLoadingStore()
    loadingStore.isManualLoading = true
    loadingStore.loadingMessage = message
  }

  static stopToastLoading() {
    const loadingStore = useLoadingStore()
    loadingStore.isManualLoading = false
  }

  static showConfirmation(title, text, buttonConfirm = 'Da', buttonCancel = 'Nu') {}

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


  static focusInput(inputRef) {
    const { isIos } = useDevice()
    if (isIos) {
    } else {
      inputRef.value.click()
    }
  }
}

