<template>
  <div class="flex-center-vertical gap-2">
    <div class="simple-button">
      <app-icon :icon="TablerIconConstants.leftArrow" :size="22" class="cursor-pointer" @click.stop="onPrevious" />
    </div>

    <div class="simple-button">
      <app-icon :icon="TablerIconConstants.rightArrow" :size="22" class="cursor-pointer" @click.stop="onNext" />
    </div>

    <div class="text-size-13 font-weight-500 cursor-pointer mx-2" @click="showRangePopup = true">{{ rangeTitle }}</div>

    <analytics-control-buttons />
  </div>

  <analytics-range-popup v-model:show="showRangePopup" />
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const { showRangePopup, rangeTitle, onNext, onPrevious } = useAnalyticsRange()
</script>
