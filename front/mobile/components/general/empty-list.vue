<template>
  <div class="mxe mxe-state" :class="filtered ? 'r-fade' : 'n-ghost'">
    <div class="mxe-ghost">
      <div v-for="(delay, index) in delays" :key="index" class="mxe-sk" :class="{ out: filtered }" :style="{ '--d': `${delay}s` }">
        <span class="t" />
        <span class="m"><i /><i /></span>
        <span class="r" />
      </div>
      <div v-if="!filtered && hint" class="mxe-float">
        <app-icon v-if="icon" :icon="icon" :size="16" :stroke="2" />
        <span>{{ hint }}</span>
      </div>
    </div>
    <div class="mxe-tx">
      <b>{{ title || (filtered ? $t('general.list_no_results') : $t('general.list_empty')) }}</b>
      <p>{{ subtitle || (filtered ? $t('general.list_no_results_subtitle') : $t('general.list_empty_subtitle')) }}</p>
    </div>
    <div v-if="$slots.action" class="mxe-act">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
// Empty list state from the design: a ghost list (no data yet) or fading ghosts (search/filters hide everything).
const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hint: { type: String, default: '' },
  icon: { default: null },
  filtered: { type: Boolean, default: false },
})

const delays = computed(() => (props.filtered ? [0, 0.25, 0.5] : [0, 0.12, 0.24, 0.36]))
</script>
