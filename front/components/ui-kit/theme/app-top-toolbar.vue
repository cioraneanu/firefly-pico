<template>
  <van-nav-bar :safe-area-inset-top="true" :fixed="device.isMobile" :placeholder="true" v-bind="attributes" :left-text="leftText" @click-left="onBack">
    <template #right>
      <slot name="right" />
    </template>

    <template #title>
      <slot name="title">
        <div class="">
          <!--          <app-icon v-if="titleIcon" :model-value="titleIcon" />-->
          <div class="app-toolbar-title">{{ title }}</div>
          <div v-if="hasSubtitle" class="app-toolbar-subtitle">{{ subtitle }}</div>
        </div>
      </slot>

      <slot name="subtitle"> </slot>
    </template>
  </van-nav-bar>
</template>

<script setup>
import { useProfileStore } from '~/stores/profileStore'
import { useToolbar } from '~/composables/useToolbar'

const profileStore = useProfileStore()
const { title, subtitle, onBack, leftText, backRoute, titleIcon } = useToolbar()
const device = useDevice()


const hasSubtitle = computed(() => !isStringEmpty(subtitle.value))

const attributes = computed(() => {
  return {
    'left-arrow': !!backRoute.value,
  }
})
</script>
