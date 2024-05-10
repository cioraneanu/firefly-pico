// by convention, composable function names start with "use"
export function useClickWithoutSwipe({ swipeCell, onClick }) {
  let x = 0
  let y = 0
  let isOpened = false

  const onOpen = () => {
    isOpened = true
  }

  const onClose = () => {
    isOpened = false
  }

  const onMousedown = (e) => {
    x = e.clientX
    y = e.clientY
  }

  const onMouseup = (e) => {
    let threshold = 30

    const deltaX = Math.abs(e.clientX - x)
    const deltaY = Math.abs(e.clientY - y)
    const isClick = deltaX < threshold && deltaY < threshold

    if (e.which !== 1) {
      return
    }
    if (!isClick) {
      return
    }

    if (isOpened && swipeCell) {
      swipeCell.value.close()
      return
    }

    onClick()
  }

  return {
    onMouseup,
    onMousedown,
    onOpen,
    onClose,
  }
}
