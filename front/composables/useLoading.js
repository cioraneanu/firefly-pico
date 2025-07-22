import { ref } from 'vue'
import { head } from 'lodash'

const queue = ref([])
let idCounter = 0

export function useLoading() {

  const isLoading = computed(() => queue.value.length > 0)
  const loadingMessage =  computed(() => head(queue.value)?.message)

  const addLoading = (message, promise, abortController) => {
    const id = ++idCounter
    queue.value.push({ id, message, abortController })

    // Remove when done
    promise.finally(() => {
      const index = queue.value.findIndex((item) => item.id === id)
      if (index !== -1) queue.value.splice(index, 1)
    })

    return id
  }

  const cancelFirst = () => {
    const first = head(queue.value)
    if (first?.abortController) {
      first.abortController.abort()
      // Optionally remove from queue immediately
      queue.value.splice(0, 1)
    }
  }

  return {
    isLoading,
    loadingMessage,
    queue,
    addLoading,
    cancelFirst,
  }
}
