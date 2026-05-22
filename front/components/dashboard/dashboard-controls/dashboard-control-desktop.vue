<template>
  <div class="flex-center-vertical gap-2">
    <div class="simple-button">
      <app-icon :icon="TablerIconConstants.leftArrow" :size="22" class="cursor-pointer" @click.stop="onPreviousMonth" />
    </div>

    <div class="simple-button">
      <app-icon :icon="TablerIconConstants.rightArrow" :size="22" class="cursor-pointer" @click.stop="onNextMonth" />
    </div>

    <div class="text-size-13 font-weight-500 cursor-pointer mx-2" @click="onChooseMonth">{{ rangeTitle }}</div>

    <dashboard-control-buttons />
  </div>

  <app-month-year v-model="dataStore.dashboard.month" v-model:show-dropdown="showDropdown" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'
import { useDashboardControls } from '~/composables/useDashboardControls.js'

const dataStore = useDataStore()
const { showDropdown, rangeTitle, onNextMonth, onPreviousMonth, onChooseMonth } = useDashboardControls()
</script>
