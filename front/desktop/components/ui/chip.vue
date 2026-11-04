<template>
  <span class="inline-flex h-[22px] max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-md border border-line px-[7px] text-xs leading-none">
    <app-icon v-if="icon" :icon :size="12" :stroke="2" class="shrink-0 text-dim" />
    <span class="truncate">
      <slot />
    </span>
  </span>
</template>

<script setup>
defineProps({ icon: null })
</script>
