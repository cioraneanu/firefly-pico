<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getDisplayDate" is-link readonly :clickable="false" class="" left-icon="calendar-o" :label="label ?? $t('date')" placeholder="No date" v-bind="dynamicAttrs">
      <template #left-icon>
        <app-icon :icon="TablerIconConstants.settingsUserPreferencesDate" :size="20" />
      </template>

      <template #input>
        <div class="display-flex gap-2 w-100">
          <div @click.stop="showDatePicker = true" class="fake-input flex-1 cursor-pointer">
            <div :class="labelDateClass">
              <div class="day-of-week">{{ dayOfWeek }}</div>
              {{ getDisplayDate }}
            </div>
          </div>

          <div @click="onShowTimePicker" class="fake-input flex-1 cursor-pointer time-container">
            <input ref="timeInput" type="time" class="hidden-input" v-model="modelValueTime" />
            <div :class="labelDateClass">{{ getDisplayTime }}</div>
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

    <van-calendar @open="onOpen" v-model:show="showDatePicker" @confirm="onConfirmDate" :show-confirm="false" :min-date="minDate" :max-date="maxDate" color="#000" first-day-of-week="1" />
    <app-date-time-grid-time-popup v-model:show="showTimePicker" v-model="modelValueTime" />
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, addYears, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { clone, head, isNull } from 'lodash'
import { usePointerSwipe } from '@vueuse/core'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AppDateTimeGridTimePopup from '~/components/ui-kit/app-date-time-grid-time-popup.vue'

const dataStore = useDataStore()
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

  let newDate = clone(modelValue.value)
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
  let newDate = clone(modelValue.value)
  const [hours, minutes] = (newValue ?? '').split(':').map(Number)
  if (isNull(hours) || isNull(minutes)) {
    return
  }
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

watch(modelValueTime, (newValue, oldValue) => {
  if (!newValue && oldValue) {
    modelValueTime.value = oldValue
  }
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

<style scoped>
.hidden-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.time-container {
  position: relative;
  display: inline-block;
}
</style>
