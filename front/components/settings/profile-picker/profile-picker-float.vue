<template>
  <div>
    <van-floating-bubble v-model:offset="position" axis="y" magnetic="x" @click="isListVisible = true" :gap="0" class="profile-floating-button">
      <div class="flex-center flex-column" style="padding: 0 8px;">
        <icon-nut size="20" color="#fff" stroke="1.6" />
        <span v-if="profileStore.shortProfileName" class="text-size-10">{{ profileStore.shortProfileName }}</span>
      </div>
    </van-floating-bubble>

    <app-popup v-model:show="isListVisible" :style="appStore.isDesktopLayout ? null : { height: '40%' }">
      <profile-picker-list></profile-picker-list>
    </app-popup>
  </div>
</template>

<script setup>
import { IconNut } from '@tabler/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { useProfileStore } from '~/stores/profileStore.js'

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
