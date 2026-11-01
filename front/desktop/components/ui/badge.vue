<template>
  <span :class="['inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[6px] border px-1.5 text-xs font-medium', variants[variant]]">
    <slot />
  </span>
</template>

<script setup>
defineProps({ variant: { default: 'secondary' } })

const variants = {
  secondary: 'border-transparent bg-soft',
  outline: 'border-line',
  success: 'border-success/15 bg-success/10 text-success',
  warning: 'border-warning/15 bg-warning/10 text-warning',
  info: 'border-info/15 bg-info/10 text-info',
  danger: 'border-danger/15 bg-danger/10 text-danger',
  primary: 'border-transparent bg-primary text-on-primary',
}
</script>
