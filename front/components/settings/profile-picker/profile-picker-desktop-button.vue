<template>
  <div v-if="appStore.isDesktopLayout" class="flex-1-w overflow-hidden">
    <div class="profile-picker-dashboard-button flex-center" @click="isListVisible = true">
      <icon-nut size="20" stroke="1.6"  />
      <div class="profile-picker-dashboard-button-text flex-1-w ellipse-text">{{ $t('profile') }}: {{ profileStore.activeProfile?.name ?? $t('not_set') }}</div>
    </div>

    <app-popup v-model:show="isListVisible"  :style="appStore.isDesktopLayout ? null : { height: '40%' }">
      <profile-picker-list/>
    </app-popup>
  </div>
</template>

<script setup>
import { IconNut } from '@tabler/icons-vue'
import { useWindowSize } from '@vueuse/core'

const appStore = useAppStore()
const profileStore = useProfileStore()
const isListVisible = ref(false)

const { width } = useWindowSize()
// Only persist the Y position and set the X based on the current window width
const position = computed({
  get: () => ({ x: width.value - 40, y: appStore.profileFloatButtonPosition.y }),
  set: (value) => {
    appStore.profileFloatButtonPosition = { y: value.y }
  },
})
</script>

