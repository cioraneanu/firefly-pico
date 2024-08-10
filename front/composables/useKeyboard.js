export function useKeyboard() {
  const visualViewportHeight = ref(0)
  const visualViewportPageTop = ref(0)
  const visualViewportOffsetTop = ref(0)

  const keyboardHeight = ref(0)
  const isKeyboardVisible = ref(false)

  const onVisualViewportChange = async () => {
    // await sleep(200)
    visualViewportHeight.value = visualViewport.height
    visualViewportPageTop.value = visualViewport.pageTop
    visualViewportOffsetTop.value = visualViewport.offsetTop

    keyboardHeight.value = Math.max(window.innerHeight - visualViewport.height, 0)
    isKeyboardVisible.value = keyboardHeight.value > 0
  }

  onMounted(() => {
    visualViewport.addEventListener('resize', onVisualViewportChange)
    visualViewport.addEventListener('scroll', onVisualViewportChange)
  })

  onBeforeUnmount(() => {
    visualViewport.removeEventListener('resize', onVisualViewportChange)
    visualViewport.removeEventListener('scroll', onVisualViewportChange)
  })

  return { visualViewportHeight, visualViewportPageTop, visualViewportOffsetTop, keyboardHeight, isKeyboardVisible }
}
