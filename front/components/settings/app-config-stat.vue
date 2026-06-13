<template>
  <van-grid-item>
    <div class="flex-center flex-column" :class="{ 'cursor-pointer': clickable, 'config-stat-muted': muted }" @click="onClick">
      <app-icon :icon="props.icon" :size="26" :stroke="1.4" />

      <div class="font-weight-400 text-size-12 text-center text-muted">{{ props.name }}</div>
      <div class="font-weight-800 text-size-12 text-center">{{ props.value }}</div>
    </div>
  </van-grid-item>
</template>

<script setup>
const props = defineProps({
  icon: {},
  name: {},
  value: {},
  clickable: {
    type: Boolean,
    default: false,
  },
  muted: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const onClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.config-stat-muted {
  opacity: 0.35;
}
</style>
