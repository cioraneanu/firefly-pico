import { useScroll, useSwipe } from '@vueuse/core'

// Used to keep track of the current number of visible popups, so that one gesture only closes the latest and not all of them.
let globalZIndex = 0

export function useSwipeToDismiss({ onSwipe, swipeRef, showDropdown }) {
  let zIndex = null
  let isScrollOnTop = false

  watch(showDropdown, async (newValue) => {
    if (newValue) {
      globalZIndex++
      zIndex = globalZIndex
      return
    }

    await sleep(100)
    globalZIndex--
    zIndex = null
  })

  const { x, y } = useScroll(swipeRef)

  const { lengthY: swipeYDistance } = useSwipe(swipeRef, {
    disableTextSelect: true,
    onSwipe(e) {
      if (y.value < 100) {
        isScrollOnTop = true
      }
    },
    onSwipeEnd(e, direction) {
      if (swipeYDistance.value < -100 && isScrollOnTop && zIndex === globalZIndex) {
        // showDropdown.value = false
        onSwipe()
      }
      isScrollOnTop = false
    },
  })

  return {}
}
