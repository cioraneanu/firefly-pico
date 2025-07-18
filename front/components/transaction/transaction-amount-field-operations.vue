<template>
  <div class="transaction-amount-operations flex-center-vertical gap-1" :style="style">
    <div v-for="operator in operatorsList" class="button flex-center" @mousedown.prevent.stop="onOperation(operator)">
      <component :is="operator.icon" :size="16" :stroke="2.0" />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['result'])
import { IconPlus, IconMinus, IconAsteriskSimple, IconDivide } from '@tabler/icons-vue'

const onOperation = (value) => {
  emit('result', value)
}

const operator = {
  plus: { value: '+', icon: IconPlus },
  minus: { value: '-', icon: IconMinus },
  multiply: { value: '*', icon: IconAsteriskSimple },
  divide: { value: '/', icon: IconDivide },
}

const operatorsList = Object.values(operator)

onMounted(() => {})

const { isKeyboardVisible, keyboardHeight, visualViewportHeight, visualViewportOffsetTop, visualViewportPageTop, debug } = useKeyboard()

const style = computed(() => {
  const offset = 70
  const bottomWithoutKeyboard = `calc(env(safe-area-inset-bottom, 0px) + var(--van-tabbar-height) + ${offset}px)`
  const bottomWithKeyboard = `${Math.max(keyboardHeight.value - 10 + offset - visualViewportOffsetTop.value, 0)}px`
  return {
    bottom: isKeyboardVisible.value ? bottomWithKeyboard : bottomWithoutKeyboard,
  }
})
</script>
