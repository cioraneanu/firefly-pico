export default {

  // and all its children are mounted.
  mounted (element, binding, vnode, prevVnode) {
    element.addEventListener('mousedown', onMouseDown)
    element.addEventListener('mouseup', onMouseUp)

  },
  // called before the parent component is updated

  unmounted (element, binding, vnode, prevVnode) {
    element.removeEventListener('mousedown', onMouseDown)
    element.removeEventListener('mouseup', onMouseUp)
  },
}

let x = 0
let y = 0

const onMouseDown = (e) => {
  x = e.clientX
  y = e.clientY
}


const onMouseUp = (e) => {

  let threshold = 30

  const deltaX = Math.abs(e.clientX - x)
  const deltaY = Math.abs(e.clientY - y)
  const isClick = deltaX < threshold && deltaY < threshold

  if (e.which !== 1) {
    e.preventDefault()
    return
  }
  if (!isClick) {
    e.stopPropagation()
    return
  }

  // onEdit()
}