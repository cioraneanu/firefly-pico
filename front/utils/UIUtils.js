class UIUtils {
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

  static showToastLoading(message) {
    showLoadingToast({
      duration: 0,
      message: message,
      forbidClick: true,
      wordBreak: 'break-word',
    })
  }

  static stopToastLoading() {
    closeToast()
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

  static showLoadingWhen(isLoading) {
    const profileStore = useProfileStore()
    watch(isLoading, (newValue) => {
      profileStore.isLoading = newValue
    })

    // let loadingIndicator = null
    //
    // watch(
    //   () => isLoading.value,
    //   async (newValue, oldValue) => {
    //     if (newValue) {
    //       loadingIndicator = showLoadingToast({
    //         duration: 0,
    //         message: 'Loading...',
    //         forbidClick: true,
    //       })
    //     } else {
    //       closeToast()
    //     }
    //   },
    //   { immediate: true },
    // )
  }

  static focusInput(inputRef) {
    const { isIos } = useDevice()
    if (isIos) {
    } else {
      inputRef.value.click()
    }
  }
}

export default UIUtils
