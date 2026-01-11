<template>
  <van-cell-group inset class="dashboard-control-date" :style="style">
    <div class="flex-center-vertical gap-2">
      <app-icon :icon="TablerIconConstants.leftArrow" @click.stop="onPreviousMonth" :size="24" class="m-10" />

      <div class="flex-1 flex-center flex-column my-2">
        <div @click="onChooseMonth" class="text-size-14 font-weight-600">{{ rangeTitle }}</div>
        <transition name="fade">
          <dashboard-control-buttons v-if="y < 20" />
        </transition>
      </div>

      <app-icon :icon="TablerIconConstants.rightArrow" @click.stop="onNextMonth" :size="24" class="m-10" />
    </div>
  </van-cell-group>

  <app-month-year v-model="dataStore.dashboard.month" v-model:showDropdown="showDropdown" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useWindowScroll } from '@vueuse/core'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'
import { useDashboardControls } from '~/composables/useDashboardControls.js'

const dataStore = useDataStore()
const { showDropdown, rangeTitle, onNextMonth, onPreviousMonth, onChooseMonth } = useDashboardControls()

const { y } = useWindowScroll()
const style = computed(() => {
  return y.value > 20 ? `box-shadow: rgba(60, 64, 67, 0.1) 0px 1px 2px 0px, rgba(60, 64, 67, 0.05) 0px 1px 3px 1px;` : ``
})
</script>
