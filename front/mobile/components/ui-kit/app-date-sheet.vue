<template>
  <app-sheet v-model:show="show" :title="title ?? $t('kit.select_date')">
    <div class="mx-cp">
      <div class="mx-cp__h">
        <button type="button" class="mx-ib sm out" :aria-label="$t('kit.previous_month')" @click="onMove(-1)">
          <app-icon :icon="IconChevronLeft" :size="16" :stroke="2" />
        </button>
        <b>{{ getMonthTitle(view) }}</b>
        <button type="button" class="mx-ib sm out" :aria-label="$t('kit.next_month')" @click="onMove(1)">
          <app-icon :icon="IconChevronRight" :size="16" :stroke="2" />
        </button>
      </div>
      <div class="mx-cp__g mx-cp__wk">
        <span v-for="weekday in weekdays" :key="weekday" class="w">{{ weekday }}</span>
      </div>
      <div class="mx-cp__strip" @scroll="onScroll" @animationstart="onCenter">
        <div v-for="pane in panes" :key="pane.key" class="mx-cp__g mx-cp__m" :aria-label="pane.title">
          <span v-for="index in pane.lead" :key="`p${index}`" />
          <button v-for="day in pane.days" :key="day.key" type="button" :class="day.class" :disabled="day.isOff" @click="onPick(day.date)">{{ day.label }}</button>
        </div>
      </div>
    </div>

    <template #footer>
      <button v-if="clearable" type="button" class="mx-btn out" @click="onPick(null)">{{ $t('clear') }}</button>
      <button type="button" class="mx-btn pri" :disabled="isOff(startOfDay(new Date()))" @click="onPick(startOfDay(new Date()))">{{ $t('today') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import { addDays, addMonths, getDaysInMonth, isAfter, isBefore, isSameDay, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { upperFirst } from 'lodash-es'

// Calendar sheet (design: MX-Calendar). Three month panes side by side: swipe or use the arrows to change month.
// Emits the picked day at 00:00; Clear sets null.
const show = defineModel('show', { type: Boolean, default: false })
const modelValue = defineModel()

const props = defineProps({
  title: { type: String, default: null },
  minDate: { type: Date, default: null },
  maxDate: { type: Date, default: null },
  clearable: { type: Boolean, default: true },
})

const profileStore = useProfileStore()
const { locale } = useI18n()

const view = ref(startOfMonth(new Date()))
watch(show, (isShown) => isShown && (view.value = startOfMonth(modelValue.value ?? new Date())), { immediate: true })

const getMonthTitle = (date) => upperFirst(new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(date))

const weekStartsOn = computed(() => Number(profileStore.weekStartsOn) || 0)
const weekdays = computed(() => {
  const start = startOfWeek(new Date(), { weekStartsOn: weekStartsOn.value })
  return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(addDays(start, index)))
})

const isOff = (date) => (props.minDate && isBefore(date, startOfDay(props.minDate))) || (props.maxDate && isAfter(date, props.maxDate))

const getPane = (offset) => {
  const month = addMonths(view.value, offset)
  const days = Array.from({ length: getDaysInMonth(month) }, (_, index) => {
    const date = addDays(month, index)
    return {
      key: index,
      date,
      label: index + 1,
      isOff: isOff(date),
      class: { d: true, today: isSameDay(date, new Date()), on: !!modelValue.value && isSameDay(date, modelValue.value), off: isOff(date) },
    }
  })
  return { key: month.getTime(), title: getMonthTitle(month), lead: (month.getDay() - weekStartsOn.value + 7) % 7, days }
}
const panes = computed(() => [getPane(-1), getPane(0), getPane(1)])

const onPick = (date) => {
  modelValue.value = date
  show.value = false
}

// ----- swipe: when the strip settles on a side pane, step the month and jump back to the middle pane -----
let stripEl = null
const onCenter = (event) => {
  stripEl = event.currentTarget
  stripEl.scrollLeft = stripEl.clientWidth
}

const onMove = async (step) => {
  view.value = addMonths(view.value, step)
  await nextTick()
  if (stripEl) {
    stripEl.scrollLeft = stripEl.clientWidth
  }
}

let scrollTimer = null
const onScroll = (event) => {
  const el = event.currentTarget
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    const width = el.clientWidth
    if (el.scrollLeft < width * 0.25) {
      onMove(-1)
    } else if (el.scrollLeft > width * 1.75) {
      onMove(1)
    }
  }, 90)
}
</script>
