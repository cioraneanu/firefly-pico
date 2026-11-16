<template>
  <div class="mx-prof-fab touch-none" :style="{ top: `${top}px` }" @pointerdown="onDragStart" @pointermove="onDragMove" @pointerup="onDragEnd" @pointercancel="onDragEnd">
    <button
      v-if="profileStore.dashboard.isProfileFloatVisible"
      type="button"
      class="mx-prof-fab__p"
      aria-haspopup="dialog"
      :aria-label="$t('profile_page.title')"
      @click="onTap(() => (isListVisible = true))"
    >
      <span class="av"><app-icon :icon="IconNut" :size="15" :stroke="2" /></span>
      <span v-if="profileStore.shortProfileName" class="nm">{{ profileStore.shortProfileName }}</span>
    </button>

    <!-- iOS app only: record a voice ramble natively (keeps going in the background) -->
    <template v-if="isNativeApp">
      <span v-if="profileStore.dashboard.isProfileFloatVisible" class="mx-prof-fab__sep" />
      <button
        type="button"
        class="mx-prof-fab__mic"
        :class="recording.state"
        :aria-label="$t(isRecording ? 'transaction.assistant_ramble_stop_and_add' : 'transaction.assistant_ramble_record')"
        @click="onTap(toggleRecording)"
      >
        <span v-if="isRecording" class="sq" />
        <app-icon v-else :icon="recording.state === 'saved' ? IconCheck : IconMicrophone" :size="16" :stroke="2" />
      </button>
      <span v-if="isRecording" class="mx-prof-fab__time">{{ recordingTime }}</span>
    </template>
  </div>

  <profile-picker-list v-model:show="isListVisible" />
</template>

<script setup>
import { IconCheck, IconMicrophone, IconNut } from '@tabler/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { useProfileStore } from '~/core/stores/profileStore.js'

// Floating tab on the right edge (design: .mx-prof-fab): the profile switcher and, in the iOS app, the voice recorder.
// Drag it up or down; the position is remembered.
const appStore = useAppStore()
const profileStore = useProfileStore()
const { isNativeApp, recording, recordingTime, toggleRecording } = useNativeApp()
const isListVisible = ref(false)
const isRecording = computed(() => recording.value.state === 'recording')

const { height } = useWindowSize()
const dragY = ref(null)
const top = computed(() => Math.min(Math.max(dragY.value ?? appStore.profileFloatButtonPosition.y, 64), height.value - 180))

let start = null
const onDragStart = (event) => {
  start = { pointerY: event.clientY, top: top.value, moved: false }
}
const onDragMove = (event) => {
  if (!start || (!start.moved && Math.abs(event.clientY - start.pointerY) < 4)) {
    return
  }
  // Captured only once it is a drag, so a tap still clicks the button under the finger
  if (!start.moved) event.currentTarget.setPointerCapture?.(event.pointerId)
  start.moved = true
  dragY.value = start.top + event.clientY - start.pointerY
}
const onDragEnd = () => {
  if (start?.moved) {
    appStore.profileFloatButtonPosition = { y: top.value }
  }
  dragY.value = null
}
const onTap = (action) => {
  if (!start?.moved) {
    action()
  }
  start = null
}
</script>
