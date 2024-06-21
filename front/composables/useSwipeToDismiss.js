import { useScroll, useSwipe } from '@vueuse/core'

// Used to keep track of the current number of visible popups, so that one gesture only closes the latest and not all of them.
let globalZIndex = 0

export function useSwipeToDismiss({ onSwipe, swipeRef, showDropdown }) {
  let zIndex = null
  let isScrollOnTop = false
  let swipeStartAt = null

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

  const { lengthY: swipeYDistance,  } = useSwipe(swipeRef, {
    disableTextSelect: true,

    onSwipeStart(e) {
      swipeStartAt = e.timeStamp
      if (y.value < 100) {
        isScrollOnTop = true
      }
    },
    onSwipeEnd(e, direction) {
      let duration = e.timeStamp - swipeStartAt
      let velocity = Math.abs(swipeYDistance.value) / duration
      // console.log('velocity', {duration, velocity, swipeYDistance: swipeYDistance.value})

      if (zIndex === globalZIndex && swipeYDistance.value < -100) {
        if (isScrollOnTop || velocity >= 1.0) {
          onSwipe()
        }
      }

      isScrollOnTop = false
    },
  })

  return {}
}
