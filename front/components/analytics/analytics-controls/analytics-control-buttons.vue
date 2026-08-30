<template>
  <div class="text-size-14 flex-center-vertical gap-1">
    <currency-dropdown v-model="analyticsStore.analyticsCurrency" is-clearable />

    <div class="app-button-small cursor-pointer" @click="onToggleShowAmounts">
      <app-icon :icon="analyticsStore.isAmountsHidden ? TablerIconConstants.eyeHidden : TablerIconConstants.eyeVisible" :size="20" />
    </div>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useProfileStore } from '~/stores/profileStore'

const analyticsStore = useAnalyticsStore()
const profileStore = useProfileStore()

const onToggleShowAmounts = () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}
</script>
