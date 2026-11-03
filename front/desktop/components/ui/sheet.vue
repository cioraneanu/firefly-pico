<template>
  <Teleport to="#d-portal">
    <Transition name="d-sheet">
      <div v-if="open" class="fixed inset-0 z-[60]">
        <div class="absolute inset-0 bg-black/10 backdrop-blur-xs dark:bg-black/50" @click="open = false" />
        <aside ref="panel" role="dialog" aria-modal="true" class="d-sheet-panel absolute inset-y-0 right-0 flex w-[92%] max-w-115 flex-col border-l border-line bg-pop shadow-lg">
          <d-button variant="ghost" size="icon-sm" :icon="IconX" class="absolute right-3 top-3 text-dim" :aria-label="$t('close')" @click="open = false" />
          <h2 class="px-4 pb-4 pr-12 pt-4 text-base font-medium">{{ title }}</h2>
          <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex flex-col gap-2 border-t border-line p-4">
            <slot name="footer" />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { IconX } from '@tabler/icons-vue'

const open = defineModel('open')
defineProps({ title: String })

const panel = ref(null)
useLayer(open, () => (open.value = false), panel)
</script>
