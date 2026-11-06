import { unrefElement } from '@vueuse/core'

const toasts = ref([])
const confirmState = ref(null)
const layers = []
let toastId = 0

export const DesktopUI = {
  toast(message, type = 'success', duration = 3000) {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => (toasts.value = toasts.value.filter((toast) => toast.id !== id)), Math.max(duration, 2500))
  },

  confirm: (title, message) => new Promise((resolve) => (confirmState.value = { title, message, resolve })),
}

export const useDesktopUI = () => ({ toasts, confirmState })

const loadingLayers = shallowReactive([])

// Requests show their loading pill only in the innermost d-loading (an open dialog over its page)
export function useLoadingLayer() {
  const layer = {}
  loadingLayers.push(layer)
  onBeforeUnmount(() => loadingLayers.splice(loadingLayers.indexOf(layer), 1))
  return computed(() => useLoadingStore().isLoadingDelayed && loadingLayers.at(-1) === layer)
}

// A layer moves focus to its [autofocus] element when it opens and gives focus back when it closes
export function useLayer(isOpen, onEscape, panel) {
  const layer = { onEscape, panel }
  const remove = () => {
    if (!layers.includes(layer)) return
    layers.splice(layers.indexOf(layer), 1)
    layer.restore?.focus({ preventScroll: true })
  }

  watch(
    isOpen,
    async (open) => {
      if (!open) return remove()
      layer.restore = document.activeElement
      layers.push(layer)
      await nextTick()
      unrefElement(panel)?.querySelector('[autofocus]')?.focus()
    },
    { immediate: true },
  )
  onBeforeUnmount(remove)
}

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Tab cycles inside the top modal layer and closes a popover
const onTab = (e) => {
  const layer = layers.at(-1)
  const panel = unrefElement(layer?.panel)
  if (!panel) return
  e.preventDefault()
  if (!panel.matches('[aria-modal]')) return layer.onEscape()

  const items = [...panel.querySelectorAll(focusable)]
  const index = items.indexOf(document.activeElement)
  items.at(e.shiftKey ? (index <= 0 ? -1 : index - 1) : (index + 1) % items.length)?.focus()
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') layers.at(-1)?.onEscape()
  if (e.key === 'Tab') onTab(e)
})
