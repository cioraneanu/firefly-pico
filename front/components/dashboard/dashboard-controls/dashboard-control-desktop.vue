<template>
  <div class="flex-center-vertical gap-2">
    <app-icon :icon="TablerIconConstants.leftArrow" @click.stop="onPreviousMonth" :size="24" class="cursor-pointer" />
    <app-icon :icon="TablerIconConstants.rightArrow" @click.stop="onNextMonth" :size="24" class="cursor-pointer" />

    <div @click="onChooseMonth" class="text-size-14 font-weight-600 cursor-pointer mx-2">{{ rangeTitle }}</div>

    <dashboard-control-buttons />
  </div>

  <app-month-year v-model="dataStore.dashboard.month" v-model:showDropdown="showDropdown" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'
import { useDashboardControls } from '~/composables/useDashboardControls.js'

const dataStore = useDataStore()
const { showDropdown, rangeTitle, onNextMonth, onPreviousMonth, onChooseMonth } = useDashboardControls()
</script>
