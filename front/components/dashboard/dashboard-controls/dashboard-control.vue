<template>
  <van-cell-group inset class="dashboard-control-date" :style="style">
    <div class="flex-center-vertical gap-2">
      <app-icon :icon="TablerIconConstants.leftArrow" :size="24" class="m-10 cursor-pointer" @click.stop="onPreviousMonth" />

      <div class="flex-1 flex-center flex-column my-2">
        <div class="text-size-14 font-weight-600 cursor-pointer" @click="onChooseMonth">{{ rangeTitle }}</div>
        <transition name="dashboard-controls-row">
          <dashboard-control-buttons v-if="y < 20" />
        </transition>
      </div>

      <app-icon :icon="TablerIconConstants.rightArrow" :size="24" class="m-10 cursor-pointer" @click.stop="onNextMonth" />
    </div>
  </van-cell-group>

  <app-month-year v-model="dashboardStore.month" v-model:show-dropdown="showDropdown" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useWindowScroll } from '@vueuse/core'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'
import { useDashboardControls } from '~/composables/useDashboardControls.js'

import { useDashboardStore } from '~/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const { showDropdown, rangeTitle, onNextMonth, onPreviousMonth, onChooseMonth } = useDashboardControls()

const { y } = useWindowScroll()
const style = computed(() => {
  return y.value > 20 ? `box-shadow: rgba(60, 64, 67, 0.1) 0px 1px 2px 0px, rgba(60, 64, 67, 0.05) 0px 1px 3px 1px;` : ``
})
</script>

<style scoped>
.dashboard-control-date {
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.dashboard-controls-row-enter-active,
.dashboard-controls-row-leave-active {
  max-height: 40px;
  overflow: hidden;
  transform-origin: top center;
  transition:
    max-height 0.22s ease,
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.dashboard-controls-row-enter-from,
.dashboard-controls-row-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px) scaleY(0.7);
}

.dashboard-controls-row-enter-to,
.dashboard-controls-row-leave-from {
  max-height: 40px;
  opacity: 1;
  transform: translateY(0) scaleY(1);
}
</style>
