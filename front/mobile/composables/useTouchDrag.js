// One-finger drag shared by the kit's gestures (sheet drag to close, pull to refresh, calendar pager, row tap guard).
// After the finger moves `threshold` px, onLock(dx, dy) decides if the gesture is ours: if so, the page stops scrolling
// and onMove({ dx, dy, vx, vy }) follows the finger (v = px/ms). onEnd({ isDrag, isMoved, vx, vy }) runs on release
// (isMoved: the finger went past the threshold, whether or not the drag was ours).
// onStart(event) returning false ignores the touch. Bind the returned listeners with v-on.
export function useTouchDrag({ onStart, onLock, onMove, onEnd, threshold = 4 }) {
  let touch = null

  const touchstart = (event) => {
    touch = null
    if (event.touches.length !== 1 || onStart?.(event) === false) return
    const { clientX: x, clientY: y } = event.touches[0]
    touch = { x, y, lastX: x, lastY: y, lastTime: event.timeStamp, vx: 0, vy: 0, isDrag: null }
  }

  const touchmove = (event) => {
    if (!touch) return
    const { clientX, clientY } = event.touches[0]
    const dx = clientX - touch.x
    const dy = clientY - touch.y
    if (touch.isDrag === null) {
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return
      touch.isDrag = event.cancelable && !!onLock?.(dx, dy)
    }
    if (!touch.isDrag) return
    event.preventDefault()
    const elapsed = event.timeStamp - touch.lastTime
    if (elapsed > 0) Object.assign(touch, { vx: (clientX - touch.lastX) / elapsed, vy: (clientY - touch.lastY) / elapsed })
    Object.assign(touch, { lastX: clientX, lastY: clientY, lastTime: event.timeStamp })
    onMove?.({ dx, dy, vx: touch.vx, vy: touch.vy })
  }

  const touchend = () => {
    if (touch) onEnd?.({ isDrag: !!touch.isDrag, isMoved: touch.isDrag !== null, vx: touch.vx, vy: touch.vy })
    touch = null
  }

  return { touchstart, touchmove, touchend, touchcancel: touchend }
}
