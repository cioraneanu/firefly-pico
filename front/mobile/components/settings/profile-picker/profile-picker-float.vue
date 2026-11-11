<template>
  <button
    type="button"
    class="mx-prof-fab touch-none"
    :style="{ top: `${top}px` }"
    aria-haspopup="dialog"
    :aria-label="$t('profile_page.title')"
    @pointerdown="onDragStart"
    @pointermove="onDragMove"
    @pointerup="onDragEnd"
    @pointercancel="onDragEnd"
    @click="onClick"
  >
    <span class="av"><app-icon :icon="IconNut" :size="15" :stroke="2" /></span>
    <span v-if="profileStore.shortProfileName" class="nm">{{ profileStore.shortProfileName }}</span>
  </button>

  <profile-picker-list v-model:show="isListVisible" />
</template>

<script setup>
import { IconNut } from '@tabler/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { useProfileStore } from '~/core/stores/profileStore.js'

// Floating profile tab on the right edge (design: .mx-prof-fab). Drag it up or down; the position is remembered.
const appStore = useAppStore()
const profileStore = useProfileStore()
const isListVisible = ref(false)

const { height } = useWindowSize()
const dragY = ref(null)
const top = computed(() => Math.min(Math.max(dragY.value ?? appStore.profileFloatButtonPosition.y, 64), height.value - 180))

let start = null
const onDragStart = (event) => {
  start = { pointerY: event.clientY, top: top.value, moved: false }
  event.currentTarget.setPointerCapture?.(event.pointerId)
}
const onDragMove = (event) => {
  if (!start || (!start.moved && Math.abs(event.clientY - start.pointerY) < 4)) {
    return
  }
  start.moved = true
  dragY.value = start.top + event.clientY - start.pointerY
}
const onDragEnd = () => {
  if (start?.moved) {
    appStore.profileFloatButtonPosition = { y: top.value }
  }
  dragY.value = null
}
const onClick = () => {
  if (!start?.moved) {
    isListVisible.value = true
  }
  start = null
}
</script>
