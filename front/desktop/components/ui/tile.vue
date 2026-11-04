<template>
  <span :class="['grid shrink-0 place-items-center', sizes[size], primary ? 'bg-primary text-on-primary' : muted ? 'bg-soft text-dim' : 'bg-soft text-fg']">
    <app-icon v-if="icon" :icon :size="size === 'sm' ? 14 : 16" :stroke="2" />
    <slot />
  </span>
</template>

<script setup>
defineProps({ icon: null, size: { default: 'md' }, primary: Boolean, muted: Boolean })

const sizes = { sm: 'size-6 rounded-md', md: 'size-8 rounded-lg', lg: 'size-10 rounded-lg' }
</script>
