<template>
  <transition :name="transitionName">
    <div v-if="showLoading" class="app-loading-background">
      <div class="app-loading flex-column flex-center">
        <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
        <div class="text-size-16">{{ loadingStore.loadingMessage }}</div>
        
        <div v-if="loadingStore.activeRequests.length > 0" class="text-size-12 text-muted mt-2">
          {{ loadingStore.activeRequests.length }} {{ $t('requests_remaining') }}
        </div>
        
        <van-button 
          v-if="loadingStore.activeRequests.length > 0 && showCancelButton" 
          @click="loadingStore.cancelActiveRequests()" 
          class="mt-4" 
          size="small" 
          type="danger">
          {{ $t('stop') }}
        </van-button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { IconRotate } from '@tabler/icons-vue'
import { useLoadingStore } from '~/stores/loadingStore'

const profileStore = useProfileStore()
const loadingStore = useLoadingStore()
const transitionName = computed(() => profileStore.showAnimations ? 'fade' : '')

const showLoading = ref(loadingStore.isLoading)
const showCancelButton = ref(false)
let timeout = null
let hideTimeout = null

watch(() => loadingStore.isLoading, (isLoading) => {
  if (isLoading) {
    if (hideTimeout) clearTimeout(hideTimeout)
    showLoading.value = true
    
    showCancelButton.value = false
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      showCancelButton.value = true
    }, 2000)
  } else {
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      showLoading.value = false
      showCancelButton.value = false
      if (timeout) clearTimeout(timeout)
    }, 300)
  }
}, { immediate: true })

onUnmounted(() => {
  if (timeout) clearTimeout(timeout)
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>

<style></style>
