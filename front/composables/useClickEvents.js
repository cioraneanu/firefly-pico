import { ref } from 'vue'

export function useClickEvents(options = {}) {
  const {
    delay = 300, // milliseconds to wait before executing single click
    preventDefault = false,
    stopPropagation = false,
  } = options

  const clickTimer = ref(null)
  const clickCount = ref(0)

  const handleClick = ({ single, double }) => {
    clickCount.value++
    console.log('wtf', clickCount.value)

    if (clickCount.value === 1) {
      // Single click - wait to see if double click follows
      clickTimer.value = setTimeout(() => {
        if (clickCount.value === 1 && single) {
          single()
        }
        console.log('reset')

        clickCount.value = 0
      }, delay)
    } else if (clickCount.value === 2) {
      // Double click - clear timer and execute double click
      clearTimeout(clickTimer.value)
      clickCount.value = 0
      console.log('double!')
      double?.()
    }
  }

  // Clean up timer on unmount
  const cleanup = () => {
    if (clickTimer.value) {
      clearTimeout(clickTimer.value)
      clickTimer.value = null
    }
    clickCount.value = 0
  }

  return {
    // Method 1: Single handler for both events
    handleClick,

    // Utility
    cleanup,
  }
}
