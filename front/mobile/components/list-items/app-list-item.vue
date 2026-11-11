<template>
  <div ref="swipeRef" class="mx-swipe" :class="{ 'no-del': !deletable }" @scroll.passive="onScroll">
    <div class="mx-row" :class="rowClass" role="button" tabindex="0" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @click="onEdit" @keydown.enter="onEdit">
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

// A tap may wobble a few pixels, but a drag (scroll, pull to refresh) must not open the row on release:
// the pull gesture prevents the native scroll, so the browser would still fire the click
let touchStart = null
let hasDragged = false
const onTouchStart = (event) => {
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  hasDragged = false
}
const onTouchMove = (event) => {
  hasDragged ||= Math.hypot(event.touches[0].clientX - touchStart.x, event.touches[0].clientY - touchStart.y) > 10
}

const onEdit = () => {
  if (hasDragged) {
    hasDragged = false
    return
  }
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
