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

export function useLayer(isOpen, onEscape) {
  const layer = { onEscape }
  const remove = () => layers.includes(layer) && layers.splice(layers.indexOf(layer), 1)
  watch(isOpen, (open) => (open ? layers.push(layer) : remove()), { immediate: true })
  onBeforeUnmount(remove)
}

window.addEventListener('keydown', (e) => e.key === 'Escape' && layers.at(-1)?.onEscape())
