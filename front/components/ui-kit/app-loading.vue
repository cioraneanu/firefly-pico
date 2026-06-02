<template>
  <transition :name="transitionName">
    <div v-if="loadingStore.isLoading" class="app-loading-background">
      <div class="app-loading flex-column flex-center">
        <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
        <div class="text-size-16">{{ loadingStore.loadingMessage }}</div>
        
        <van-button 
          v-if="loadingStore.activeRequests.length > 0" 
          @click="loadingStore.cancelActiveRequests()" 
          class="mt-4" 
          size="small" 
          type="danger">
          Cancel Requests
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

</script>

<style></style>
