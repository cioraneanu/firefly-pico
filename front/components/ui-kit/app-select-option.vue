<template>
  <div class="display-flex flex-column align-items-center">
    <app-icon v-if="props.icon" :icon="props.icon" :badge="props.badge" />
    <div class="van-grid-item__text app-tag app-select-option-text">{{ props.text }}</div>
    <div class="app-icon-item"></div>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants'

const props = defineProps({
  text: {},
  icon: {},
  badge: {},
  isSelected: {
    default: false,
  },
})

const computedClass = computed(() => {
  return {
    active: props.isSelected,
    // 'active': true,
  }
})
</script>

<style></style>
