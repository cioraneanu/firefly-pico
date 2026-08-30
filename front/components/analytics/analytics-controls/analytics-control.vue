<template>
  <van-cell-group inset class="dashboard-control-date">
    <div class="flex-center-vertical gap-2">
      <app-icon :icon="TablerIconConstants.leftArrow" :size="24" class="m-10 cursor-pointer" @click.stop="onPrevious" />

      <div class="flex-1 flex-center flex-column my-2">
        <div class="text-size-14 font-weight-600 cursor-pointer" @click="showRangePopup = true">{{ rangeTitle }}</div>
        <analytics-control-buttons />
      </div>

      <app-icon :icon="TablerIconConstants.rightArrow" :size="24" class="m-10 cursor-pointer" @click.stop="onNext" />
    </div>
  </van-cell-group>

  <analytics-range-popup v-model:show="showRangePopup" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const { showRangePopup, rangeTitle, onNext, onPrevious } = useAnalyticsRange()
</script>
