<template>
  <div class="flex-center-vertical gap-2">
    <app-icon :icon="TablerIconConstants.leftArrow" @click.stop="onPreviousMonth" :size="24" class="m-10" />
    <app-icon :icon="TablerIconConstants.rightArrow" @click.stop="onNextMonth" :size="24" class="m-10" />

    <div class="flex-1 flex-center flex-column my-2">
      <div @click="onChooseMonth" class="text-size-14 font-weight-600">{{ rangeTitle }}</div>
      <transition name="fade">
        <dashboard-control-buttons />
      </transition>
    </div>
  </div>

  <app-month-year v-model="dataStore.dashboard.month" v-model:showDropdown="showDropdown" />
</template>

<script setup>
import { addMonths } from 'date-fns'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useWindowScroll } from '@vueuse/core'
import { animateOnNext, animateOnPrevious } from '~/utils/AnimationUtils.js'
import DashboardControls from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'

const dataStore = useDataStore()
const profileStore = useProfileStore()

const rangeTitle = computed(() => {
  let date1 = DateUtils.dateToUI(dataStore.dashboardDateStart)
  let date2 = DateUtils.dateToUI(dataStore.dashboardDateEnd)
  return `${date1} - ${date2}`
})
const onNextMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, 1)
  animateOnNext()
}
const onPreviousMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, -1)
  animateOnPrevious()
}

const showDropdown = ref(false)

const onChooseMonth = () => {
  showDropdown.value = true
}

watch(
  () => dataStore.dashboard.month,
  (newValue) => {
    dataStore.fetchDashboardTransactionsForInterval()
  },
)
</script>
