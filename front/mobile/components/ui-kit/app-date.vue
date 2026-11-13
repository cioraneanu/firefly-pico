<template>
  <div class="mx-f" :class="{ bad: !!error }">
    <slot name="label">
      <div class="mx-l">{{ label ?? $t('date') }}<span v-if="isRequired || required" class="req">*</span></div>
    </slot>

    <div class="mx-sel" :class="{ dis: disabled }" role="button" tabindex="0" aria-haspopup="dialog" :aria-label="label ?? $t('date')" :name="name" @click="onShow" @keydown.enter.prevent="onShow">
      <span class="val">
        <app-icon :icon="IconCalendar" :size="16" :stroke="2" />
        <span v-if="modelValue" class="tx">{{ DateUtils.dateToUI(modelValue) }}</span>
        <span v-else class="ph">{{ $t('kit.no_date') }}</span>
      </span>
      <button v-if="modelValue && !disabled" type="button" class="x" :aria-label="$t('clear')" @click.stop="modelValue = null">
        <app-icon :icon="IconX" :size="14" :stroke="2" />
      </button>
    </div>

    <div v-if="error" class="mx-ferr">{{ error }}</div>

    <app-date-sheet v-model:show="show" v-model="modelValue" :title="label ?? $t('date')" :min-date="minDate" :max-date="maxDate" />
  </div>
</template>

<script setup>
import { IconCalendar, IconX } from '@tabler/icons-vue'
import { subYears } from 'date-fns'
import DateUtils from '~/core/utils/DateUtils'

// Date field (design: .mx-sel with a calendar icon) that opens the calendar sheet.
const modelValue = defineModel()

const props = defineProps({
  label: { type: String, default: null },
  name: { type: String, default: null },
  rules: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  minDate: { type: Date, default: () => subYears(new Date(), 5) },
  maxDate: { type: Date, default: undefined },
})

const { error, isRequired } = useFormField({ name: () => props.name, rules: () => props.rules, value: modelValue })

const show = ref(false)
const onShow = () => !props.disabled && (show.value = true)
</script>
