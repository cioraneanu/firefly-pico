<template>
  <div :class="{ 'opacity-40': props.muted }">
    <span class="k"><app-icon :icon="props.icon" :size="14" :stroke="2" />{{ props.name }}</span>
    <b>{{ props.value }}</b>
  </div>
</template>

<script setup>
// One key/value row of a .mx-kv list (Setup › Loaded data stats).
const props = defineProps({
  icon: {
    type: [String, Object, Function],
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  value: {
    type: [Number, String],
    default: '',
  },
  muted: {
    type: Boolean,
    default: false,
  },
})
</script>
