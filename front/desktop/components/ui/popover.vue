<template>
  <Teleport to="#d-portal">
    <div v-if="open" class="fixed inset-0 z-[64]" @mousedown="open = false" />
    <Transition name="d-pop">
      <div v-if="open" :style class="fixed z-[65] flex flex-col overflow-y-auto rounded-lg bg-pop p-1 text-sm shadow-md ring-1 ring-fg/10">
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { unrefElement, useEventListener } from '@vueuse/core'

const open = defineModel('open')
const props = defineProps({ anchor: null, align: { default: 'start' }, matchWidth: Boolean, width: String })

const style = ref({})

const place = () => {
  const rect = unrefElement(props.anchor)?.getBoundingClientRect()
  if (!rect) return
  const below = innerHeight - rect.bottom - 12
  const up = below < 260 && rect.top > below
  style.value = {
    [up ? 'bottom' : 'top']: `${up ? innerHeight - rect.top + 4 : rect.bottom + 4}px`,
    [props.align === 'end' ? 'right' : 'left']: `${props.align === 'end' ? innerWidth - rect.right : rect.left}px`,
    minWidth: props.matchWidth ? `${rect.width}px` : '9rem',
    width: props.width,
    maxHeight: `${Math.min(360, (up ? rect.top : below) - 8)}px`,
  }
}

watch(open, (value) => value && place())
useLayer(open, () => (open.value = false))
useEventListener(window, ['resize', 'scroll'], () => (open.value = false))
</script>
