<template>
  <app-popup v-model:show="show">
    <div class="h-100 display-flex flex-column">
      <div class="van-popup-title px-4">{{ $t('calendar') }}</div>

      <van-cell-group inset style="overflow: auto">
        <van-cell
          v-for="preset in rangePresetList"
          :key="preset.code"
          :title="$t(preset.t)"
          clickable
          :is-link="preset.code === selectedPreset"
          @click="onPresetClick(preset)"
        />
      </van-cell-group>

      <van-cell-group v-if="selectedPreset === customCode" inset style="overflow: auto">
        <van-cell :title="$t('date_after')" :value="startLabel" is-link @click="showStartPicker = true" />
        <van-cell :title="$t('date_before')" :value="endLabel" is-link @click="showEndPicker = true" />
        <div class="p-3">
          <van-button block type="primary" size="small" :disabled="!localStart || !localEnd" @click="onConfirmCustom">{{ $t('ok') }}</van-button>
        </div>
      </van-cell-group>
    </div>
  </app-popup>

  <app-month-year v-model="localStart" v-model:show-dropdown="showStartPicker" :popup-title="$t('date_after')" />
  <app-month-year v-model="localEnd" v-model:show-dropdown="showEndPicker" :popup-title="$t('date_before')" />
</template>

<script setup>
import { rangePreset } from '~/utils/DateRangeUtils'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const show = defineModel('show', { type: Boolean, default: false })

const { presetCode, rangePresetList, range, setPreset, setCustomRange } = useAnalyticsRange()
const customCode = rangePreset.custom.code

const selectedPreset = ref(presetCode.value)
const localStart = ref(null)
const localEnd = ref(null)
const showStartPicker = ref(false)
const showEndPicker = ref(false)

watch(show, (isOpen) => {
  if (!isOpen) return
  selectedPreset.value = presetCode.value
  localStart.value = presetCode.value === customCode ? range.value.start : null
  localEnd.value = presetCode.value === customCode ? range.value.end : null
})

const startLabel = computed(() => (localStart.value ? DateUtils.dateToUI(localStart.value) : '-'))
const endLabel = computed(() => (localEnd.value ? DateUtils.dateToUI(localEnd.value) : '-'))

const onPresetClick = (preset) => {
  if (preset.code === customCode) {
    selectedPreset.value = customCode
    return
  }
  setPreset(preset.code)
}

const onConfirmCustom = () => {
  setCustomRange({ start: localStart.value, end: localEnd.value })
}
</script>
