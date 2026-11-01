<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap border font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
      variants[variant],
      sizes[size],
    ]"
  >
    <icon-loader-2 v-if="loading" class="d-spin" :size="iconSize" />
    <component :is="icon" v-else-if="icon" :size="iconSize" />
    <slot />
  </component>
</template>

<script setup>
import { IconLoader2 } from '@tabler/icons-vue'

const props = defineProps({
  variant: { default: 'outline' },
  size: { default: 'md' },
  icon: [Object, Function],
  to: String,
  type: { default: 'button' },
  loading: Boolean,
  disabled: Boolean,
})

const NuxtLink = resolveComponent('NuxtLink')

const variants = {
  primary: 'border-transparent bg-primary text-on-primary hover:bg-primary/85',
  outline: 'border-line bg-bg hover:bg-soft dark:border-field dark:bg-field/30 dark:hover:bg-field/50',
  secondary: 'border-transparent bg-soft hover:bg-soft/70',
  ghost: 'border-transparent hover:bg-soft',
  danger: 'border-transparent bg-danger/10 text-danger hover:bg-danger/20 dark:bg-danger/20 dark:hover:bg-danger/30',
}

const sizes = {
  md: 'h-8 gap-1.5 rounded-lg px-2.5 text-sm',
  sm: 'h-7 gap-1 rounded-md px-2.5 text-[13px]',
  xs: 'h-6 gap-1 rounded-md px-2 text-xs',
  icon: 'size-8 rounded-lg',
  'icon-sm': 'size-7 rounded-md',
  'icon-xs': 'size-6 rounded-md',
}

const iconSize = computed(() => ({ xs: 12, 'icon-xs': 12, sm: 14, 'icon-sm': 14 })[props.size] ?? 16)
</script>
