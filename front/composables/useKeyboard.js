export function useKeyboard() {
  const isKeyboardVisible = ref(false)
  const keyboardHeight = ref(0)
  const originalHeight = ref(0)

  const onResize = async () => {
    // await sleep(1000)
    keyboardHeight.value = Math.max(window.innerHeight - visualViewport.height, 0)
    isKeyboardVisible.value = keyboardHeight.value > 0
  }

  onMounted(() => {
    originalHeight.value = window.innerHeight
    visualViewport.addEventListener('resize', onResize)
  })

  onBeforeUnmount(() => {
    visualViewport.removeEventListener('resize', onResize)
  })

  return { isKeyboardVisible, keyboardHeight }
}
