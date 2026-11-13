<template>
  <div class="mx-f" :class="{ bad: !!error }">
    <slot name="label">
      <div class="mx-l">{{ label ?? $t('date') }}<span v-if="isRequired || required" class="req">*</span></div>
    </slot>

    <div class="mx-3q">
      <div
        class="mx-sel"
        :class="{ dis: disabled }"
        role="button"
        tabindex="0"
        aria-haspopup="dialog"
        :aria-label="label ?? $t('date')"
        :name="name"
        @click="onShowDate"
        @keydown.enter.prevent="onShowDate"
      >
        <span class="val">
          <app-icon :icon="IconCalendar" :size="16" :stroke="2" />
          <span v-if="modelValue" class="tx"
            ><span class="mt" style="margin-right: 6px">{{ dayOfWeek }}</span
            >{{ DateUtils.dateToUI(modelValue) }}</span
          >
          <span v-else class="ph">{{ $t('kit.no_date') }}</span>
        </span>
      </div>
      <div
        class="mx-sel"
        :class="{ dis: disabled || !modelValue }"
        role="button"
        tabindex="0"
        aria-haspopup="dialog"
        :aria-label="$t('kit.choose_time')"
        @click="onShowTime"
        @keydown.enter.prevent="onShowTime"
      >
        <span class="val">
          <app-icon :icon="IconClock" :size="16" :stroke="2" />
          <span v-if="modelValue" class="tx mx-tnum">{{ modelValueTime }}</span>
          <span v-else class="ph">{{ $t('kit.no_time') }}</span>
        </span>
      </div>
    </div>

    <div v-if="error" class="mx-ferr">{{ error }}</div>

    <app-date-sheet
      v-model:show="showDatePicker"
      :model-value="modelValue"
      :title="label ?? $t('date')"
      :min-date="minDate"
      :max-date="maxDate"
      :clearable="false"
      @update:model-value="onConfirmDate"
    />
    <app-date-time-grid-time-popup v-model:show="showTimePicker" v-model="modelValueTime" />
  </div>
</template>

<script setup>
import { IconCalendar, IconClock } from '@tabler/icons-vue'
import { addYears, subYears } from 'date-fns'
import DateUtils from '~/core/utils/DateUtils'

// Date + time of a transaction: date and time pickers side by side
const modelValue = defineModel()

const props = defineProps({
  label: { type: String, default: null },
  name: { type: String, default: null },
  rules: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const { error, isRequired } = useFormField({ name: () => props.name, rules: () => props.rules, value: modelValue })

const showDatePicker = ref(false)
const showTimePicker = ref(false)

const minDate = subYears(new Date(), 1)
const maxDate = addYears(new Date(), 1)

const dayOfWeek = computed(() => DateUtils.dateToString(modelValue.value, 'EEEEEE'))

// Keep the time when the day changes
const setDay = (day) => {
  const newDate = new Date(modelValue.value ?? day)
  newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
  modelValue.value = newDate
}

const onConfirmDate = (value) => value && setDay(value)

const onShowDate = () => !props.disabled && (showDatePicker.value = true)
const onShowTime = () => !props.disabled && modelValue.value && (showTimePicker.value = true)

const modelValueTime = computed({
  get: () => (modelValue.value ? DateUtils.dateToString(modelValue.value, 'HH:mm') : null),
  set: (value) => {
    const [hours, minutes] = (value || '00:00').split(':').map(Number)
    const newDate = new Date(modelValue.value)
    newDate.setHours(hours, minutes)
    modelValue.value = newDate
  },
})
</script>
