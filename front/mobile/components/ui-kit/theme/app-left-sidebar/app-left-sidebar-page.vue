<template>
  <nuxt-link :to="route">
    <div class="flex items-center">
      <app-icon :icon="icon" :size="20" />
      {{ label }}
      <div v-if="dot" class="van-badge van-badge--dot"/>
    </div>
  </nuxt-link>
</template>

<script setup>
import { useProfileStore } from '~/core/stores/profileStore.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { animateBottomToolbarAddButton } from '~/core/utils/AnimationUtils.js'

const props = defineProps({
  label: {},
  icon: {},
  route: {},
  dot: {}
})
</script>
