<template>
  <div v-if="appStore.isDesktopLayout" class="profile-picker-wrapper">
    <div class="profile-picker-dashboard-button flex-center" @click="isListVisible = true">
      <icon-nut size="20" stroke="1.6"  />
      <div class="profile-picker-dashboard-button-text">Profile: {{ profileStore.activeProfile?.name }}</div>
    </div>

    <app-popup v-model:show="isListVisible"  :style="appStore.isDesktopLayout ? null : { height: '40%' }">
      <profile-picker-list></profile-picker-list>
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

<style scoped>
.profile-picker-wrapper {
  min-width: 0;
  overflow: hidden;
  flex: 1;
}


.profile-picker-dashboard-button .profile-picker-dashboard-button-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}
</style>

