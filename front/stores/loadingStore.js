import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isManualLoading = ref(false)
  const loadingMessage = ref('Loading...')
  const activeRequests = ref([])

  const isLoading = computed(() => isManualLoading.value || activeRequests.value.length > 0)

  function addActiveRequest(request) {
    activeRequests.value.push(request)
  }

  function removeActiveRequest(id) {
    activeRequests.value = activeRequests.value.filter(req => req.id !== id)
  }

  function cancelActiveRequests() {
    activeRequests.value.forEach(req => {
      if (req.controller) {
        req.controller.abort()
      }
    })
    activeRequests.value = []
  }

  return {
    isManualLoading,
    loadingMessage,
    activeRequests,
    isLoading,
    addActiveRequest,
    removeActiveRequest,
    cancelActiveRequests,
  }
})
