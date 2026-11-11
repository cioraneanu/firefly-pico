<template>
  <div v-if="bars.length > 0" class="mx-bars">
    <button v-for="(bar, index) in bars" :key="bar.id ?? index" type="button" class="mx-bar" @click="emit('select', bar)">
      <span class="nm">
        <app-icon :icon="getIcon(bar)" :size="15" :stroke="2" />
        <span>{{ bar.label }}</span>
      </span>
      <b class="mx-money">{{ bar.value }}</b>
      <span class="trk"><span :style="{ width: `${bar.percent}%` }" /></span>
    </button>
  </div>

  <div v-else class="mx-inline-empty">
    <app-icon :icon="emptyIcon" :size="16" :stroke="2" />
    <span>{{ emptyText ?? $t('dash_page.no_data') }}</span>
  </div>
</template>

<script setup>
import { IconChartBar } from '@tabler/icons-vue'

// Horizontal bars of a dashboard card (design: .mx-bars), or the inline empty state.
defineProps({
  bars: { type: Array, default: () => [] },
  getIcon: { type: Function, required: true },
  emptyText: { type: String, default: null },
  emptyIcon: { default: () => IconChartBar },
})

const emit = defineEmits(['select'])
</script>
