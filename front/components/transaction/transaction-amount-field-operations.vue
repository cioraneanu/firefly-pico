<template>
  <transition name="fade-slide" mode="out-in">
    <div class="transaction-amount-operations flex-center-vertical gap-1" :style="style">
      <div v-for="operator in operatorsList" class="button" @mousedown.prevent.stop="onOperation(operator)">
        <component :is="operator.icon" :size="20" :stroke="1.6" />
      </div>
    </div>
  </transition>
</template>

<script setup>
const emit = defineEmits(['result'])
import { IconPlus, IconMinus, IconAsterisk, IconDivide } from '@tabler/icons-vue'

const onOperation = (value) => {
  emit('result', value)
}

// const operatorsList = ref(['+', '-', '*', '/'])

const operator = {
  plus: { icon: IconPlus },
  minus: { icon: IconMinus },
  multiply: { icon: IconAsterisk },
  divide: { icon: IconDivide },
}

const operatorsList = Object.values(operator)

onMounted(() => {})

const { isKeyboardVisible, keyboardHeight, visualViewportHeight, visualViewportOffsetTop, visualViewportPageTop, debug } = useKeyboard()

const style = computed(() => {
  const offset = 70
  const bottomWithoutKeyboard = `calc(env(safe-area-inset-bottom, 0px) + var(--van-tabbar-height) + ${offset}px)`
  const bottomWithKeyboard = `${Math.max(keyboardHeight.value + 10 + offset - visualViewportOffsetTop.value, 0)}px`
  return {
    bottom: isKeyboardVisible.value ? bottomWithKeyboard : bottomWithoutKeyboard,
  }
})
</script>
