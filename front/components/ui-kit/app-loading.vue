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

onMounted(async () => {
  await nextTick()

  // anime({
  //   targets: '.app-loading',
  //   translateX: [-10, 0, -10, 0, -10],
  //   loop: true,
  //   easing: 'linear',
  //   duration: 700,
  // })

})
</script>

<style>
.animate-rotate-infinite {
  animation: apply-rotation 1s infinite linear;
}

@keyframes apply-rotation {
  100% {
    transform: rotate(-1turn);
  }
}
</style>
