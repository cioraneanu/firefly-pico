<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getDisplayDate" is-link readonly :clickable="false" class="" left-icon="calendar-o" :label="label" placeholder="No date" v-bind="dynamicAttrs">
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

      <!--      <template #right-icon>-->
      <!--        <div>-->
      <!--          <van-icon-->
      <!--              v-if="modelValue"-->
      <!--              @click.prevent.stop="date = null"-->
      <!--              name="clear"/>-->
      <!--        </div>-->
      <!--      </template>-->
    </van-field>

    <div v-if="false" class="display-flex" style="gap: 3px">
      <div class="display-flex flex-1 ml-15" style="justify-content: flex-start; align-items: center; gap: 3px">
        <span class="text-size-14 mr-20 text-muted">Quick actions:</span>
        <van-button @click.prevent.stop="onClickedMinusDay" type="default" size="normal">-1</van-button>
        <van-button @click.prevent.stop="onClickedToday" type="default" size="normal">Today</van-button>
        <van-button @click.prevent.stop="onClickedAddDay" type="default" size="normal">+1</van-button>
      </div>
    </div>

    <van-calendar v-model:show="showDatePicker" @confirm="onConfirmDate" :show-confirm="false" :min-date="minDate" :max-date="maxDate" color="#ee0a24" />

    <app-popup v-model:show="showTimePicker" round position="bottom" style="padding-top: 4px">
        <div>
          <van-time-picker :model-value="tempTime" :filter="timeFilter" title="Choose time" @confirm="onConfirmTime" :visible-option-num="14" />
        </div>
    </app-popup>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, addYears, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { clone, get } from 'lodash'

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
const tempTime = computed(() => {
  let date = modelValue.value ?? new Date()
  let hour = date.getHours()
  let minute = Math.ceil(date.getMinutes() / 10) * 10
  return [hour, minute]
})

const showDatePicker = ref(null)
const showTimePicker = ref(null)

const minDate = subYears(new Date(), 1)
const maxDate = addYears(new Date(), 1)

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

const onConfirmTime = (value) => {
  showTimePicker.value = false

  let newDate = clone(modelValue.value)
  let hours = parseInt(get(value, 'selectedValues.0', '0'))
  let minutes = parseInt(get(value, 'selectedValues.1', '0'))
  newDate.setHours(hours)
  newDate.setMinutes(minutes)
  modelValue.value = newDate
}

const getDisplayTime = computed(() => {
  if (!modelValue.value) {
    return 'No time'
  }
  return DateUtils.dateToString(modelValue.value, 'HH:mm')
})

// -------------------------------

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
