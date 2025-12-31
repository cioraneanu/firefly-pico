<template>
  <nuxt-link :to="route">
    <div class="flex-center-vertical">
      <app-icon :icon="icon" :size="20" />
      {{ label }}
    </div>
  </nuxt-link>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore.js'
import { useProfileStore } from '~/stores/profileStore.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'

const props = defineProps({
  label: {},
  icon: {},
  route: {},
})
</script>
