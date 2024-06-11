<template>
  <div class="app-button-save flex-center-vertical gap-2" :style="style">
    <slot name="left"></slot>
    <van-button round type="primary" native-type="submit" class="flex-1 shadow-depth2">
      {{ label }}
    </van-button>
    <slot name="right" />
  </div>
</template>

<script setup>
import anime from 'animejs'

const props = defineProps({
  label: {
    default: 'Save',
  },
  bottom: {
    default: '70',
  },
})

const keyboardOffset = ref(0)
visualViewport.addEventListener('resize', () => {
  keyboardOffset.value = window.innerHeight - visualViewport.height
})

const style = computed(() => {
  return {
    // opacity: '0',
    // 'bottom': `calc(env(safe-area-inset-bottom) + ${props.bottom}px)`,
    bottom: keyboardOffset.value === 0 ? `calc(env(safe-area-inset-bottom) + ${props.bottom}px)` : `calc( ${keyboardOffset.value}px + 10px )`,
  }
})

onMounted(async () => {
  anime({
    targets: '.app-button-save',
    opacity: [0, 1],
    scale: [0.7, 1],
    delay: 200,
    duration: 700,
  })
})
</script>
