<template>
  <transition name="fade">
    <div v-if="appStore.isLoading" class="app-loading-background">
        <div class="app-loading flex-column flex-center">
          <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
          <div class="text-size-16">Loading...</div>
        </div>
    </div>
  </transition>
</template>

<script setup>
import { IconRotate } from '@tabler/icons-vue'
import anime from 'animejs'

const appStore = useAppStore()

// onMounted(async () => {
//   await nextTick()
// })
</script>

<style></style>
