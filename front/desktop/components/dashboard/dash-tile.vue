<template>
  <component :is="to ? NuxtLink : 'div'" :to class="flex min-w-0 flex-col gap-1.5 rounded-xl bg-soft/50 p-3 transition-colors hover:bg-soft">
    <span class="flex items-center justify-between gap-1.5">
      <span class="truncate text-xs text-dim">{{ label }}</span>
      <app-icon v-if="icon" :icon :size="14" :stroke="2" :class="['shrink-0', texts[tone] ?? 'text-dim']" />
    </span>
    <b :class="['truncate text-[17px] font-semibold leading-[22px] tabular-nums', texts[tone]]">{{ value }}</b>
    <span class="h-1 overflow-hidden rounded-full bg-fg/9">
      <span :class="['block h-full rounded-full', bars[tone] ?? 'bg-fg']" :style="{ width: `${Math.min(Math.max(meter || 0, 0), 100)}%` }" />
    </span>
    <span class="truncate text-[11px] leading-[14px] text-dim">{{ hint }}</span>
  </component>
</template>

<script setup>
defineProps({ label: String, value: [String, Number], hint: String, icon: null, tone: String, meter: Number, to: String })

const NuxtLink = resolveComponent('NuxtLink')
const texts = { expense: 'text-danger', income: 'text-income', transfer: 'text-transfer' }
const bars = { expense: 'bg-danger', income: 'bg-income', transfer: 'bg-transfer' }
</script>
