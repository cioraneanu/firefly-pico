<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field
      v-model="getDisplayDate"
      is-link
      readonly
      :clickable="false"
      class=""
      left-icon="calendar-o"
      :label="label"
      placeholder="No date"
      v-bind="dynamicAttrs"
    >
      <template #input>
        <div class="display-flex gap-2 w-100">
          <div @click.stop="showDatePicker = true" class="fake-input flex-1 cursor-pointer">
            <div :class="labelDateClass">
              {{ getDisplayDate }}
            </div>
          </div>

          <div @click.stop="onShowTimePicker" class="fake-input flex-1 cursor-pointer">
            <div :class="labelDateClass">
              {{ getDisplayTime }}
            </div>
          </div>
        </div>
      </template>
    </van-field>

    <div v-if="false" class="display-flex" style="gap: 3px">
      <div class="display-flex flex-1 ml-15" style="justify-content: flex-start; align-items: center; gap: 3px">
        <span class="text-size-14 mr-20 text-muted">Quick actions:</span>
        <van-button @click.prevent.stop="onClickedMinusDay" type="default" size="normal">-1</van-button>
        <van-button @click.prevent.stop="onClickedToday" type="default" size="normal">Today</van-button>
        <van-button @click.prevent.stop="onClickedAddDay" type="default" size="normal">+1</van-button>
      </div>
    </div>

    <van-calendar
      v-model:show="showDatePicker"
      @confirm="onConfirmDate"
      :show-confirm="false"
      :min-date="minDate"
      :max-date="maxDate"
      color="#000"
      first-day-of-week="1"
    />

    <van-popup v-model:show="showTimePicker" round position="bottom" style="padding-top: 4px">
      <div ref="popupRef" class="h-100 display-flex flex-column app-date-time-grid">
        <div class="display-flex">
          <div class="flex-1"></div>
          <div class="m-3 cursor-pointer" @click="onConfirmTime">Confirm</div>
        </div>

        <div style="margin-bottom: 8rem">
          <div class="van-popup-title mb-2">Select an hour</div>

          <van-grid :column-num="6" class="">
            <template v-for="(hour, index) in hours" :key="index">
              <van-grid-item @click="onClickHour(hour)" :class="getHourItemClass(hour)">
                <template #default>
                  <div class="van-grid-item__text">{{ hour }}</div>
                  <div class="app-icon-item"></div>
                </template>
              </van-grid-item>
            </template>
          </van-grid>

          <div class="van-popup-title mb-2 mt-30">Select an minute</div>

          <van-grid :column-num="6">
            <template v-for="(minute, index) in minutes" :key="index">
              <van-grid-item @click="onClickMinute(minute)" :class="getMinuteItemClass(minute)">
                <template #default>
                  <div class="van-grid-item__text">{{ minute }}</div>
                  <div class="app-icon-item"></div>
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, addYears, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { clone } from 'lodash'
import { usePointerSwipe } from '@vueuse/core'

const dataStore = useDataStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
    default: 'Date time',
  },
})

const modelValue = defineModel()
const modelValueHour = ref(null)
const modelValueMinute = ref(null)

const showDatePicker = ref(null)
const showTimePicker = ref(null)

const minDate = subYears(new Date(), 1)
const maxDate = addYears(new Date(), 1)

let hours = [...Array(24).keys()].map((item) => (item < 10 ? `0${item}` : item))
let minutes = [...Array(12).keys()].map((item) => item * 5).map((item) => (item < 10 ? `0${item}` : item))

const labelDateClass = computed(() => {
  return {
    'text-muted': !props.modelValue,
  }
})

const getDisplayDate = computed(() => {
  if (!modelValue.value) {
    return 'No date'
  }
  return DateUtils.dateToUI(modelValue.value)
})

const onConfirmDate = (value) => {
  showDatePicker.value = false

  let newDate = clone(modelValue.value)
  newDate.setFullYear(value.getFullYear())
  newDate.setMonth(value.getMonth())
  newDate.setDate(value.getDate())

  modelValue.value = newDate
}

// ------

const onShowTimePicker = () => {
  showTimePicker.value = true
}
const timeFilter = (type, options) => {
  if (type === 'minute') {
    return options.filter((option) => Number(option.value) % 5 === 0)
  }
  return options
}

const getHourItemClass = (hour) => {
  return {
    'cursor-pointer p-5': true,
    active: parseInt(modelValueHour.value ?? -1) === parseInt(hour),
  }
}

const getMinuteItemClass = (minute) => {
  return {
    'cursor-pointer p-5': true,
    active: parseInt(modelValueMinute.value ?? -1) === parseInt(minute),
  }
}

const onConfirmTime = () => {
  showTimePicker.value = false

  let newDate = clone(modelValue.value)
  // let hours = parseInt(get(value, 'selectedValues.0', '0'))
  // let minutes = parseInt(get(value, 'selectedValues.1', '0'))
  newDate.setHours(parseInt(modelValueHour.value))
  newDate.setMinutes(parseInt(modelValueMinute.value))
  modelValue.value = newDate
}

const getDisplayTime = computed(() => {
  if (!modelValue.value) {
    return 'No time'
  }
  return DateUtils.dateToString(modelValue.value, 'HH:mm')
})

// -------------------------------

watch(modelValue, (newValue) => {
  if (!newValue) {
    modelValueHour.value = null
    modelValueMinute.value = null
  }
  modelValueHour.value = newValue.getHours()
  modelValueMinute.value = Math.ceil(newValue.getMinutes() / 10) * 10
})

const onClickHour = (value) => {
  modelValueHour.value = value
}

const onClickMinute = (value) => {
  modelValueMinute.value = value
}

const popupRef = ref(null)

const { distanceY } = usePointerSwipe(popupRef, {
  disableTextSelect: true,
  onSwipeEnd(e, direction) {
    if (distanceY.value < -100) {
      onConfirmTime()
    }
  },
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

<style></style>
