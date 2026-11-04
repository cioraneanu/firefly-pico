<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to
    :type="to ? undefined : 'button'"
    role="listitem"
    :class="['flex min-h-13 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-soft/60', active && 'bg-soft/60']"
  >
    <d-tile :icon :style="{ marginLeft: `${indent * 24}px` }" />
    <span class="flex min-w-0 flex-1 flex-col">
      <span class="flex items-center gap-1.5">
        <span class="truncate font-medium">{{ title }}</span>
        <slot name="title" />
      </span>
      <span v-if="subtitle || $slots.subtitle" class="flex flex-wrap items-center gap-1.5 text-[13px] leading-[18px] text-dim">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </span>
    <slot />
    <icon-chevron-right :size="16" class="text-dim" />
  </component>
</template>

<script setup>
import { IconChevronRight } from '@tabler/icons-vue'

defineProps({ title: String, subtitle: String, icon: null, to: String, active: Boolean, indent: { default: 0 } })

const NuxtLink = resolveComponent('NuxtLink')
</script>
