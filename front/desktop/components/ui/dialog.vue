<template>
  <Teleport to="#d-portal">
    <Transition name="d-dialog" appear>
      <div v-if="open" class="fixed inset-0 z-[60] overflow-y-auto">
        <div class="fixed inset-0 bg-black/10 backdrop-blur-xs dark:bg-black/50" @click="emit('close')" />
        <div class="pointer-events-none relative flex min-h-full items-start justify-center px-4 py-12">
          <div ref="panel" role="dialog" aria-modal="true" :class="['d-dialog-panel pointer-events-auto relative flex w-full flex-col rounded-xl bg-pop shadow-lg ring-1 ring-fg/10', sizes[size]]">
            <div class="absolute right-3 top-3 flex items-center gap-1">
              <slot name="actions" />
              <d-button variant="ghost" size="icon-sm" :icon="IconX" class="text-dim" :aria-label="$t('close')" @click="emit('close')" />
            </div>
            <div :class="['flex flex-col gap-1.5 px-4 pt-4', $slots.actions ? 'pr-28' : 'pr-12']">
              <h2 class="text-base font-medium">{{ title }}</h2>
              <p v-if="description" class="text-sm text-dim">{{ description }}</p>
            </div>
            <div class="flex flex-col gap-4 p-4">
              <slot />
            </div>
            <div v-if="$slots.footer" class="flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t border-line bg-soft/50 p-4">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { IconX } from '@tabler/icons-vue'

const props = defineProps({ open: Boolean, title: String, description: String, size: { default: 'md' } })
const emit = defineEmits(['close'])

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' }

const panel = ref(null)
useLayer(toRef(props, 'open'), () => emit('close'), panel)
</script>
