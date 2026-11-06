<template>
  <div class="relative">
    <Transition name="d-pop">
      <div
        v-if="isLoading"
        role="status"
        class="pointer-events-none absolute left-1/2 top-[min(22%,5.25rem)] z-10 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-fg px-3.5 py-2 text-sm font-medium text-bg shadow-lg"
      >
        <icon-loader-2 :size="16" class="d-spin opacity-85" />
        {{ $t('loading') }}
      </div>
    </Transition>
    <div v-bind="$attrs" :class="['transition-[opacity,filter] duration-200', isLoading && 'pointer-events-none opacity-55 blur-[2px]']" :aria-busy="isLoading">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { IconLoader2 } from '@tabler/icons-vue'

defineOptions({ inheritAttrs: false })

const isLoading = useLoadingLayer()
</script>
