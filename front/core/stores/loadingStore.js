import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash-es'

export const useLoadingStore = defineStore('loading', () => {
  const loadingMessage = ref('Loading...')
  const activeRequests = ref([])

  const isLoading = computed(() => activeRequests.value.length > 0)

  const isLoadingDelayed = ref(false)
  const setIsLoadingDelayed = debounce(() => (isLoadingDelayed.value = false), 400)
  watch(isLoading, (v) => (v ? (setIsLoadingDelayed.cancel(), (isLoadingDelayed.value = true)) : setIsLoadingDelayed()))

  function addActiveRequest(request) {
    activeRequests.value.push(request)
  }

  function removeActiveRequest(id) {
    activeRequests.value = activeRequests.value.filter((req) => req.id !== id)
  }

  function cancelActiveRequests() {
    activeRequests.value.forEach((req) => {
      if (req.controller) {
        req.controller.abort()
      }
    })
    activeRequests.value = []
  }

  return {
    loadingMessage,
    activeRequests,
    isLoading,
    isLoadingDelayed,
    addActiveRequest,
    removeActiveRequest,
    cancelActiveRequests,
  }
})
