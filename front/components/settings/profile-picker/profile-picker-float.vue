<template>
  <div>
    <van-floating-bubble v-model:offset="offset" axis="y" magnetic="x" @click="isListVisible = true" :gap="0" class="profile-floating-button">
      <icon-nut size="20" color="#fff" stroke="1.6" />
    </van-floating-bubble>

    <van-popup v-model:show="isListVisible" position="bottom" :style="{ height: '40%' }">
      <profile-picker-list></profile-picker-list>
    </van-popup>
  </div>
</template>

<script setup>
import { IconSettings, IconSettingsStar, IconNut } from '@tabler/icons-vue'

const profileStore = useProfileStore()
const isListVisible = ref(false)
const offset = ref({ y: window.innerHeight / 2.2 })
</script>
