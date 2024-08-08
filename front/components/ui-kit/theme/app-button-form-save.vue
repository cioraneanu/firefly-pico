<template>
  <div class="app-button-save flex-center-vertical gap-2" :style="style">
    <slot name="left"></slot>
    <van-button round type="primary" native-type="submit" class="flex-1 shadow-depth2"> {{ label }} {{ isKeyboardVisible }} {{ keyboardHeight }} </van-button>
    <slot name="right" />
  </div>
</template>

<script setup>
import anime from 'animejs'
import { animateSaveButton } from '~/utils/AnimationUtils.js'

const props = defineProps({
  label: {
    default: 'Save',
  },
  bottom: {
    default: '70',
  },
})

const { isKeyboardVisible, keyboardHeight } = useKeyboard()

const style = computed(() => {
  const bottomWithKeyboard = `calc(env(safe-area-inset-bottom, 0px) + ${props.bottom}px)`
  const bottomWithoutKeyboard = `calc( ${keyboardHeight.value}px + 10px )`
  return {
    // 'bottom': `calc(env(safe-area-inset-bottom) + ${props.bottom}px)`,
    // bottom: keyboardOffset.value === 0 ? `calc(env(safe-area-inset-bottom) + ${props.bottom}px)` : `calc( ${keyboardOffset.value}px + 10px )`,
    bottom: isKeyboardVisible.value ? bottomWithKeyboard : bottomWithoutKeyboard,
  }
})

onMounted(async () => {
  await animateSaveButton()
})
</script>
