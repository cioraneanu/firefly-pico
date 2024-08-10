<template>
  <div class="app-button-save flex-center-vertical gap-2" :style="style">
    <slot name="left"></slot>
    <van-button round type="primary" native-type="submit" class="flex-1 shadow-depth2">
      {{ label }}

      <!--    1000 debug attempts to get the save button to stick above the mobile Keyboard -->
      <template v-if="false">
        <div class="text-size-10">Keyboard = {{ isKeyboardVisible }}, Height = {{ keyboardHeight }}</div>
        <div class="text-size-10">
          H = {{ visualViewportHeight }}, page = {{ visualViewportPageTop }}, offset =
          {{ visualViewportOffsetTop }}
        </div>
      </template>
    </van-button>
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
    default: '20',
  },
})

const { isKeyboardVisible, keyboardHeight, visualViewportHeight, visualViewportOffsetTop, visualViewportPageTop } = useKeyboard()

const style = computed(() => {
  const bottomWithoutKeyboard = `calc(env(safe-area-inset-bottom, 0px) + var(--van-tabbar-height) + ${props.bottom}px)`
  const bottomWithKeyboard = `calc( ${keyboardHeight.value}px + 10px )`

  return {
    bottom: isKeyboardVisible.value ? bottomWithKeyboard : bottomWithoutKeyboard,
  }
})

onMounted(async () => {
  await animateSaveButton()
})
</script>
