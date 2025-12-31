import { useWindowSize } from '@vueuse/core'

export function useResize() {
  const appStore = useAppStore()

  const { width } = useWindowSize()

  watch(width, (newValue) => {
    appStore.windowWidth = newValue
  }, {immediate: true})
}
