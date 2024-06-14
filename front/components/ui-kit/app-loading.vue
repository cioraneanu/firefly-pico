<template>
  <div v-if="appStore.isLoading" class="app-loading-background">
    <div class="app-loading flex-column flex-center">
      <div class="app-loading-content flex-column flex-center">
        <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
        <div class="text-size-16">Loading...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconRotate } from '@tabler/icons-vue'
import anime from 'animejs'

const appStore = useAppStore()

watch(
  () => appStore.isLoading,
  async (newValue) => {
    await nextTick()

    anime({
      targets: '.app-loading-content',
      translateY: [-2, 2],
      // scale: [1.0, 0.98],
      // left: '10px',
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 500,
    })
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
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
