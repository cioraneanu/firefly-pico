export function useKeyboard() {
  const isKeyboardVisible = ref(false)
  const keyboardHeight = ref(0)

  const originalHeight = ref(0)

  const onResize = () => {
    const threshold = 100
    isKeyboardVisible.value = window.innerHeight < originalHeight.value - threshold
    keyboardHeight.value = Math.max(window.innerHeight - visualViewport.height, 0)
  }

  onMounted(() => {
    console.log('Mounted called')
    originalHeight.value = window.innerHeight
    window.addEventListener('resize', onResize)
  })

  onBeforeUnmount(() => {
    console.log('Unmounted called')
    window.removeEventListener('resize', onResize)
  })

  return { isKeyboardVisible, keyboardHeight }
}
