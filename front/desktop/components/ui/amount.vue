<template>
  <span :class="['whitespace-nowrap font-medium tabular-nums', colors[type?.code]]">{{ sign[type?.code] ?? '' }}{{ value }} {{ currency }}</span>
</template>

<script setup>
defineProps({ value: [String, Number], currency: String, type: Object })

const colors = { income: 'text-income', transfer: 'text-dim' }
const sign = { expense: '−', income: '+' }
</script>
