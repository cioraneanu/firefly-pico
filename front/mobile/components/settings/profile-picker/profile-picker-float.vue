<template>
  <div
    class="mx-prof-fab touch-none"
    :class="{ 'is-hid': isHidden, 'is-drag': dragX !== null || dragY !== null, rec: isRecording }"
    :style="{ top: `${top}px`, transform: dragX === null ? null : `translateX(${dragX}px)` }"
    @pointerdown="onDragStart"
    @pointermove="onDragMove"
    @pointerup="onDragEnd"
    @pointercancel="onDragEnd"
    @click="onClick"
  >
    <span class="mx-prof-fab__grip" aria-hidden="true"><i v-for="dot in 6" :key="dot" /></span>
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
// Drag it up or down to move it, sideways to tuck it into the edge (a shorter sliver with the dot grip; a tap pulls it back); both are remembered.
const appStore = useAppStore()
const profileStore = useProfileStore()
const { isNativeApp, recording, recordingTime, toggleRecording } = useNativeApp()
const isListVisible = ref(false)
const isRecording = computed(() => recording.value.state === 'recording')
const isHidden = computed(() => !!appStore.profileFloatButtonPosition.hidden)

const { height } = useWindowSize()
const dragX = ref(null)
const dragY = ref(null)
const top = computed(() => Math.min(Math.max(dragY.value ?? appStore.profileFloatButtonPosition.y, 64), height.value - 180))

let start = null
const onDragStart = (event) => {
  start = { pointerX: event.clientX, pointerY: event.clientY, top: top.value, width: event.currentTarget.offsetWidth, axis: null }
  // Tucked, only the grip is under the finger: hold on to the pointer before it leaves it
  if (isHidden.value) event.currentTarget.setPointerCapture?.(event.pointerId)
}
const onDragMove = (event) => {
  if (!start) {
    return
  }
  const dx = event.clientX - start.pointerX
  const dy = event.clientY - start.pointerY
  if (!start.axis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
      return
    }
    // Captured only once it is a drag, so a tap still clicks the button under the finger
    start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  if (start.axis === 'y') {
    dragY.value = start.top + dy
  } else {
    const hiddenX = start.width - 16
    dragX.value = Math.min(Math.max((isHidden.value ? hiddenX : 0) + dx, 0), hiddenX)
  }
}
const onDragEnd = () => {
  if (start?.axis === 'y') {
    appStore.profileFloatButtonPosition = { ...appStore.profileFloatButtonPosition, y: top.value }
  }
  if (start?.axis === 'x') {
    appStore.profileFloatButtonPosition = { ...appStore.profileFloatButtonPosition, hidden: dragX.value > start.width * 0.35 }
  }
  dragX.value = null
  dragY.value = null
}
const onTap = (action) => !start?.axis && action()
// Runs after the buttons' own clicks; a tucked tab only takes clicks here, and a tap pulls it back
const onClick = () => {
  if (isHidden.value && !start?.axis) {
    appStore.profileFloatButtonPosition = { ...appStore.profileFloatButtonPosition, hidden: false }
  }
  start = null
}
</script>
