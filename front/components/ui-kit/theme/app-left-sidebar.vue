<template>
  <div class="app-left-sidebar">


    <div class="flex-center-vertical">
      <app-icon :icon="TablerIconConstants.dashboard" :size="20"  />
      Home
    </div>


    <div class="flex-center-vertical">
      <app-icon :icon="TablerIconConstants.transaction" :size="20" />
      Transactions
    </div>

    <div class="flex-center-vertical">
      <app-icon :icon="TablerIconConstants.transaction" :size="20" />
      Transactions
    </div>

    <div class="flex-center-vertical">
      <app-icon :icon="TablerIconConstants.transaction" :size="20" />
      Transactions
    </div>
  </div>

</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { useProfileStore } from '~/stores/profileStore'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'

const dataStore = useDataStore()
const profileStore = useProfileStore()
const appStore = useAppStore()
const route = useRoute()


</script>