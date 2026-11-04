<template>
  <div :class="['flex rounded-lg border border-dashed border-line text-[13px] text-dim', stacked ? 'flex-col gap-2 p-3' : 'flex-wrap items-center gap-2 py-1.5 pl-2.5 pr-1.5']">
    <slot />
  </div>
</template>

<script setup>
defineProps({ stacked: Boolean })
</script>
