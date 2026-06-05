<template>
  <transition :name="transitionName">
    <div v-if="loadingStore.isLoading" class="app-loading-background">
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
const transitionName = computed(() => profileStore.showAnimations ? 'fade' : '')

const loadingStore = useLoadingStore()
const showCancelButton = ref(false)


</script>

<style></style>
