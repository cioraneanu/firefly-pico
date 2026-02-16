<template>
  <!--    DESKTOP    -->
  <template v-if="appStore.isDesktopLayout">
    <div class="app-top-toolbar-desktop">
      <div class="flex-1">
        <slot name="title">
          <div class="flex-center-vertical gap-2">
            <icon-arrow-left v-if="backRouteDesktop" :size="20" @click="onBack" />
            <div>
              <div class="app-toolbar-title">{{ title }}</div>
              <div v-if="hasSubtitle" class="app-toolbar-subtitle">{{ subtitle }}</div>
              <slot name="subtitle" />
            </div>
          </div>
        </slot>
      </div>
      <div>
        <slot name="right" />
      </div>
    </div>
  </template>

  <!--    MOBILE    -->
  <template v-else>
    <van-nav-bar :safe-area-inset-top="true" :fixed="true" :placeholder="true" v-bind="attributes" :left-text="leftText" @click-left="onBack">
      <template #right>
        <slot name="right" />
      </template>

      <template #title>
        <slot name="title">
          <div class="">
            <div class="app-toolbar-title">{{ title }}</div>
            <div v-if="hasSubtitle" class="app-toolbar-subtitle">{{ subtitle }}</div>
          </div>
        </slot>
      </template>
    </van-nav-bar>
  </template>
</template>

<script setup>
import { useProfileStore } from '~/stores/profileStore'
import { useToolbar } from '~/composables/useToolbar'
import { IconArrowLeft } from '@tabler/icons-vue'

const appStore = useAppStore()
const profileStore = useProfileStore()
const { title, subtitle, onBack, leftText, backRoute, backRouteDesktop, titleIcon } = useToolbar()
const device = useDevice()

const hasSubtitle = computed(() => !isStringEmpty(subtitle.value))

const attributes = computed(() => {
  return {
    'left-arrow': !!backRoute.value,
  }
})
</script>
<script setup lang="ts"></script>
