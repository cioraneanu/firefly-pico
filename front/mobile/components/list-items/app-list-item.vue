<template>
  <div ref="swipeRef" class="mx-swipe" :class="{ 'no-del': !deletable }" @scroll.passive="onScroll">
    <div class="mx-row" :class="rowClass" role="button" tabindex="0" @click="onEdit" @keydown.enter="onEdit">
      <slot />
    </div>
    <button v-if="deletable" type="button" class="mx-swipe__del" :aria-label="$t('delete')" @click.stop="onDelete">
      <app-icon :icon="IconTrash" :size="18" :stroke="2" />
      <span>{{ $t('delete') }}</span>
    </button>
  </div>
</template>

<script setup>
import { IconTrash } from '@tabler/icons-vue'

// List row of the mobile kit: swipe left to reveal Delete (native horizontal scroll + snap, as in the design).
// Like iOS, an open row closes on the next touch anywhere else, and a tap that only closes it opens nothing.
defineProps({
  rowClass: { default: 'mid' },
  deletable: { type: Boolean, default: true },
})

const emit = defineEmits(['onEdit', 'onDelete'])
const swipeRef = ref(null)

const close = () => swipeRef.value?.scrollTo({ left: 0, behavior: 'smooth' })

const swallowClick = (event) => {
  event.stopPropagation()
  event.preventDefault()
}
const onTouchOutside = (event) => {
  if (swipeRef.value?.contains(event.target)) {
    return
  }
  close()
  if (event.target.closest('.mx-swipe')) {
    document.addEventListener('click', swallowClick, { capture: true, once: true })
    setTimeout(() => document.removeEventListener('click', swallowClick, { capture: true }), 600)
  }
}

let isOpen = false
const setOpen = (value) => {
  if (value !== isOpen) {
    isOpen = value
    document[value ? 'addEventListener' : 'removeEventListener']('touchstart', onTouchOutside, { capture: true, passive: true })
  }
}
const onScroll = () => setOpen(swipeRef.value.scrollLeft > 4)
onBeforeUnmount(() => setOpen(false))

const onEdit = () => {
  if (isOpen) {
    close()
    return
  }
  emit('onEdit')
}

const onDelete = () => {
  swipeRef.value?.scrollTo({ left: 0 })
  emit('onDelete')
}
</script>
