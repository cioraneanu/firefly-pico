<template>
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

<script setup>
import { useToolbar } from '~/mobile/composables/useToolbar'

const { title, subtitle, onBack, leftText, backRoute } = useToolbar()

const hasSubtitle = computed(() => !isStringEmpty(subtitle.value))

const attributes = computed(() => {
  return {
    'left-arrow': !!backRoute.value,
  }
})
</script>
<script setup lang="ts"></script>
