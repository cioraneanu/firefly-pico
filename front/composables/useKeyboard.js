export function useKeyboard() {
  const visualViewportHeight = ref(0)
  const visualViewportPageTop = ref(0)
  const visualViewportOffsetTop = ref(0)

  const keyboardHeight = ref(0)
  const isKeyboardVisible = ref(false)

  const debug = ref(null)

  const onVisualViewportChange = async () => {
    // await sleep(200)
    visualViewportHeight.value = visualViewport.height
    visualViewportPageTop.value = visualViewport.pageTop
    visualViewportOffsetTop.value = visualViewport.offsetTop

    const windowHeight = Math.max(window.innerHeight, document.documentElement.clientHeight)
    keyboardHeight.value = Math.max(windowHeight - visualViewport.height, 0)
    isKeyboardVisible.value = keyboardHeight.value > 2  // Initially was 0, bumped it a little since visualViewport.height is not integer

    debug.value = {
      innerH: window.innerHeight,
      client: document.documentElement.clientHeight,
    }
  }

  onMounted(() => {
    visualViewport.addEventListener('resize', onVisualViewportChange)
    visualViewport.addEventListener('scroll', onVisualViewportChange)
  })

  onBeforeUnmount(() => {
    visualViewport.removeEventListener('resize', onVisualViewportChange)
    visualViewport.removeEventListener('scroll', onVisualViewportChange)
  })

  return {
    visualViewportHeight,
    visualViewportPageTop,
    visualViewportOffsetTop,
    keyboardHeight,
    isKeyboardVisible,
    debug,
  }
}
