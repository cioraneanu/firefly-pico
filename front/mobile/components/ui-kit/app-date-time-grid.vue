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

    <div v-if="quick && !disabled" class="mx-quick" role="group" :aria-label="label ?? $t('date')">
      <button type="button" class="mx-quick__b" @click="onShift(-1)">
        <app-icon :icon="IconChevronLeft" :size="13" :stroke="2" />
        <span>{{ $t('desktop.one_day') }}</span>
      </button>
      <button type="button" class="mx-quick__b" :class="{ on: isToday }" :aria-pressed="isToday" @click="onToday">{{ $t('today') }}</button>
      <button type="button" class="mx-quick__b" @click="onShift(1)">
        <span>{{ $t('desktop.one_day') }}</span>
        <app-icon :icon="IconChevronRight" :size="13" :stroke="2" />
      </button>
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
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-vue'
import { addDays, addYears, isToday as isDateToday, subYears } from 'date-fns'
import DateUtils from '~/core/utils/DateUtils'

// Date + time of a transaction (design: MX-TransactionNew): date and time pickers side by side,
// optional -1 day / Today / +1 day shortcuts below (`quick`).
const modelValue = defineModel()

const props = defineProps({
  label: { type: String, default: null },
  name: { type: String, default: null },
  rules: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  quick: { type: Boolean, default: false },
})

const { error, isRequired } = useFormField({ name: () => props.name, rules: () => props.rules, value: modelValue })

const showDatePicker = ref(false)
const showTimePicker = ref(false)

const minDate = subYears(new Date(), 1)
const maxDate = addYears(new Date(), 1)

const dayOfWeek = computed(() => DateUtils.dateToString(modelValue.value, 'EEEEEE'))
const isToday = computed(() => !!modelValue.value && isDateToday(modelValue.value))

// Keep the time when the day changes
const setDay = (day) => {
  const newDate = new Date(modelValue.value ?? day)
  newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
  modelValue.value = newDate
}

const onConfirmDate = (value) => value && setDay(value)
const onShift = (days) => modelValue.value && (modelValue.value = addDays(modelValue.value, days))
const onToday = () => setDay(new Date())

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
