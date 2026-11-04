export const useTapEvent = {
  single: 'single',
  double: 'double',
  long: 'long',
}
export function useTap(callback, options = {}) {
  const {
    longPressDelay = 500,
    doubleClickDelay = 200
  } = options

  let clickCount = 0
  let longPressTimer = null
  let doubleClickTimer = null
  let singleClickTimer = null
  let isLongPressed = false
  let isPointerDown = false

  const resetState = () => {
    clickCount = 0
    isLongPressed = false
    isPointerDown = false
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (doubleClickTimer) {
      clearTimeout(doubleClickTimer)
      doubleClickTimer = null
    }
    if (singleClickTimer) {
      clearTimeout(singleClickTimer)
      singleClickTimer = null
    }
  }

  const handlePointerDown = (event) => {
    event.preventDefault()
    isPointerDown = true
    clickCount++
    isLongPressed = false

    // Start long press timer
    longPressTimer = setTimeout(() => {
      if (isPointerDown && !isLongPressed) {
        isLongPressed = true
        callback(useTapEvent.long)
        resetState()
      }
    }, longPressDelay)

    // Handle double click detection
    if (clickCount === 2) {
      // Double click detected - cancel everything
      clearTimeout(longPressTimer)
      clearTimeout(singleClickTimer)

      if (!isLongPressed) {
        callback(useTapEvent.double)
      }
      resetState()
    }
  }

  const handlePointerUp = () => {
    isPointerDown = false

    // If long press already fired, don't do anything
    if (isLongPressed) {
      resetState()
      return
    }

    // Cancel long press since user released
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    // Handle single click only after pointer is up
    if (clickCount === 1) {
      singleClickTimer = setTimeout(() => {
        if (clickCount === 1 && !isLongPressed) {
          callback(useTapEvent.single)
        }
        resetState()
      }, doubleClickDelay)
    }
  }

  const handlePointerLeave = () => {
    isPointerDown = false

    // Cancel long press if pointer leaves the element
    if (longPressTimer && !isLongPressed) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  // Return the event handlers to bind to the element
  return {
    // onPointerdown: handlePointerDown,
    // onPointerup: handlePointerUp,
    // onPointerleave: handlePointerLeave,

    // onMousedown: handlePointerDown,
    // onMouseup: handlePointerUp,
    // onMouseleave: handlePointerLeave,

    // Touch events for mobile
    onTouchstart: handlePointerDown,
    onTouchend: handlePointerUp,
    onTouchcancel: handlePointerLeave
  }
}