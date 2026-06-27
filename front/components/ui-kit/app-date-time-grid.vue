<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getDisplayDate" is-link readonly :clickable="false" class="" left-icon="calendar-o" :label="label ?? $t('date')" placeholder="No date" v-bind="dynamicAttrs">
      <template #left-icon>
        <app-icon :icon="TablerIconConstants.settingsUserPreferencesDate" :size="20" />
      </template>

      <template #input>
        <div class="display-flex gap-2 w-100">
          <div class="fake-input flex-1 cursor-pointer" @click.stop="showDatePicker = true">
            <div :class="labelDateClass">
              <div class="day-of-week">{{ dayOfWeek }}</div>
              {{ getDisplayDate }}
            </div>
          </div>

          <div class="fake-input flex-1 cursor-pointer position-relative display-inline-block" @click="onShowTimePicker">
            <input ref="timeInput" v-model="modelValueTime" type="time" class="position-absolute-100 no-edge-top no-edge-left z-index--1 opacity-0 pointer-events-none" >
            <div :class="labelDateClass">{{ getDisplayTime }}</div>
          </div>
        </div>
      </template>
    </van-field>

    <div v-if="false" class="display-flex" style="gap: 3px">
      <div class="display-flex flex-1 ml-15" style="justify-content: flex-start; align-items: center; gap: 3px">
        <span class="text-size-14 mr-20 text-muted">Quick actions:</span>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedMinusDay">-1</van-button>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedToday">Today</van-button>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedAddDay">+1</van-button>
      </div>
    </div>

    <van-calendar v-model:show="showDatePicker" :show-confirm="false" :min-date="minDate" :max-date="maxDate" color="#000" first-day-of-week="1" @open="onOpen" @confirm="onConfirmDate" />
    <app-date-time-grid-time-popup v-model:show="showTimePicker" v-model="modelValueTime" />
  </div>
</template>

<script setup>
import DateUtils from '~/utils/DateUtils'
import { addDays, addYears, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { clone, head, isNull } from 'lodash-es'
import { usePointerSwipe } from '@vueuse/core'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AppDateTimeGridTimePopup from '~/components/ui-kit/app-date-time-grid-time-popup.vue'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
  },
})

const modelValue = defineModel()
const modelValueTime = ref(null)

const showDatePicker = ref(null)
const showTimePicker = ref(null)

const minDate = subYears(new Date(), 1)
const maxDate = addYears(new Date(), 1)

const timeInput = ref(null)

const labelDateClass = computed(() => {
  return {
    'flex-center-vertical gap-1': true,
    'text-muted': !props.modelValue,
  }
})

const getDisplayDate = computed(() => {
  if (!modelValue.value) {
    return 'No date'
  }
  return DateUtils.dateToUI(modelValue.value)
})

const dayOfWeek = computed(() => DateUtils.dateToString(modelValue.value, 'EEEEEE'))

const onConfirmDate = (value) => {
  showDatePicker.value = false

  const newDate = clone(modelValue.value)
  newDate.setFullYear(value.getFullYear())
  newDate.setMonth(value.getMonth())
  newDate.setDate(value.getDate())

  modelValue.value = newDate
}

// ------

const onShowTimePicker = () => {
  const hasBrowserTimePicker = useDevice().isMobileOrTablet
  if (hasBrowserTimePicker) {
    timeInput.value?.focus()
    timeInput.value?.showPicker?.()
  } else {
    showTimePicker.value = true
  }
}

watch(modelValueTime, (newValue, oldValue) => {
  const parseValue = newValue === null || newValue === '' ? ':' : newValue
  const [hours, minutes] = parseValue.split(':').map(Number)

  const newDate = clone(modelValue.value)
  newDate.setHours(hours)
  newDate.setMinutes(minutes)
  modelValue.value = newDate
})

const getDisplayTime = computed(() => {
  if (!modelValue.value) {
    return 'No time'
  }
  return DateUtils.dateToString(modelValue.value, 'HH:mm')
})

// -------------------------------

watch(modelValue, (newValue) => {
  modelValueTime.value = newValue ? DateUtils.dateToString(newValue, 'HH:mm') : null
})

const appCalendar = ref(null)

const onOpen = async () => {
  await nextTick()
  appCalendar.value = head(document.getElementsByClassName('van-calendar__popup'))
}

useSwipeToDismiss({
  onSwipe: () => {
    showDatePicker.value = false
  },
  swipeRef: appCalendar,
  showDropdown: showDatePicker,
})

// -------------------------------
const onClickedMinusDay = () => {
  date.value = addDays(date.value, -1)
}
const onClickedToday = () => {
  date.value = startOfDay(new Date())
}
const onClickedAddDay = () => {
  date.value = addDays(date.value, 1)
}
</script>

