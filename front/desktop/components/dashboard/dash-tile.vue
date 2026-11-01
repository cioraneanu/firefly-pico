<template>
  <component :is="to ? NuxtLink : 'div'" :to class="flex min-w-0 flex-col gap-1 rounded-lg bg-soft/50 p-3 transition-colors hover:bg-soft">
    <span class="flex items-center justify-between gap-2 text-xs text-dim">
      <span class="truncate">{{ label }}</span>
      <app-icon v-if="icon" :icon :size="15" :stroke="2" />
    </span>
    <b :class="['truncate text-base font-semibold tabular-nums', tones[tone]]">{{ value }}</b>
    <span v-if="hint" class="truncate text-xs text-dim">{{ hint }}</span>
  </component>
</template>

<script setup>
defineProps({ label: String, value: [String, Number], hint: String, icon: null, tone: String, to: String })

const NuxtLink = resolveComponent('NuxtLink')
const tones = { expense: 'text-expense', income: 'text-income', transfer: 'text-transfer', info: 'text-info' }
</script>
