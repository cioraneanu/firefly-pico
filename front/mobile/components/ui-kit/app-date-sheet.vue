<template>
  <app-sheet v-model:show="show" :title="title ?? $t('kit.select_date')">
    <div class="mx-cp">
      <div class="mx-cp__h">
        <button type="button" class="mx-ib sm out" :disabled="index <= 0" :aria-label="$t('kit.previous_month')" @click="onMove(-1)">
          <app-icon :icon="IconChevronLeft" :size="16" :stroke="2" />
        </button>
        <b aria-live="polite">{{ getMonthTitle(months[index]) }}</b>
        <button type="button" class="mx-ib sm out" :disabled="index >= months.length - 1" :aria-label="$t('kit.next_month')" @click="onMove(1)">
          <app-icon :icon="IconChevronRight" :size="16" :stroke="2" />
        </button>
      </div>
      <div class="mx-cp__g mx-cp__wk">
        <span v-for="weekday in weekdays" :key="weekday" class="w">{{ weekday }}</span>
      </div>
      <div class="mx-cp__view" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd" @click.capture="onClickCapture">
        <div ref="stripRef" class="mx-cp__strip" :class="{ dragging: isDragging }" :style="{ transform: `translateX(${-page * 100}%)` }">
          <div v-for="(month, monthIndex) in months" :key="month.getTime()" class="mx-cp__g mx-cp__m">
            <!-- Only the months around the visible one are rendered, the rest are empty pages of the same size -->
            <template v-if="Math.abs(monthIndex - index) <= 2">
              <span v-for="lead in getLead(month)" :key="`p${lead}`" />
              <button v-for="day in getDays(month)" :key="day.label" type="button" :class="day.class" :disabled="day.isOff" @click="onPick(day.date)">{{ day.label }}</button>
            </template>
          </div>
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
import { addDays, addMonths, differenceInCalendarMonths, getDaysInMonth, isAfter, isBefore, isSameDay, max, min, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { upperFirst } from 'lodash-es'

// Calendar sheet (design: MX-Calendar). Months are pages of a horizontal strip: swipe (as fast as you like)
// or use the arrows; the title follows the page under the finger. Emits the picked day at 00:00; Clear sets null.
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

// Five years each way, but never past the min / max month
const RANGE = 60
const selectedMonth = ref(startOfMonth(new Date()))
const months = computed(() => {
  const first = max([addMonths(selectedMonth.value, -RANGE), ...(props.minDate ? [startOfMonth(props.minDate)] : [])])
  const last = min([addMonths(selectedMonth.value, RANGE), ...(props.maxDate ? [startOfMonth(props.maxDate)] : [])])
  return Array.from({ length: differenceInCalendarMonths(last, first) + 1 }, (_, offset) => addMonths(first, offset))
})

// `page` is the strip position in months (fractional while dragging), `index` the month the title shows
const page = ref(0)
const index = computed(() => Math.min(Math.max(Math.round(page.value), 0), months.value.length - 1))
const stripRef = ref(null)
const isDragging = ref(false)

watch(
  show,
  (isShown) => {
    if (isShown) {
      selectedMonth.value = startOfMonth(modelValue.value ?? new Date())
      page.value = Math.max(
        0,
        months.value.findIndex((month) => month.getTime() === selectedMonth.value.getTime()),
      )
    }
  },
  { immediate: true },
)

const onMove = (step) => (page.value = Math.min(Math.max(index.value + step, 0), months.value.length - 1))

// ----- swipe: a touch pager rather than a snap scroller, so a new swipe continues from wherever the last one is
// (three quick flicks = three months) and the title changes as soon as the next month is more than half in view -----
let touch = null
let hasDragged = false
const lastPage = () => months.value.length - 1

const onTouchStart = (event) => {
  const width = event.currentTarget.clientWidth
  // Catch the strip mid-animation: continue from where it is now, not from where it was going
  const target = page.value
  page.value = -new DOMMatrixReadOnly(getComputedStyle(stripRef.value).transform).m41 / width
  touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, page: page.value, target, width, axis: null, lastX: event.touches[0].clientX, lastTime: event.timeStamp, velocity: 0 }
  hasDragged = false
}
const onTouchMove = (event) => {
  if (!touch) {
    return
  }
  const { clientX, clientY } = event.touches[0]
  const dx = clientX - touch.x
  if (!touch.axis) {
    if (Math.abs(dx) < 4 && Math.abs(clientY - touch.y) < 4) {
      return
    }
    touch.axis = Math.abs(dx) > Math.abs(clientY - touch.y) ? 'x' : 'none'
    isDragging.value = touch.axis === 'x'
  }
  if (touch.axis !== 'x') {
    return
  }
  event.preventDefault()
  hasDragged = true
  if (event.timeStamp > touch.lastTime) {
    touch.velocity = (clientX - touch.lastX) / (event.timeStamp - touch.lastTime)
  }
  touch.lastX = clientX
  touch.lastTime = event.timeStamp
  const target = touch.page - dx / touch.width
  // Rubber band past the first / last month
  const overflow = target < 0 ? target : target > lastPage() ? target - lastPage() : 0
  page.value = target - overflow + overflow / 3
}
const onTouchEnd = () => {
  if (touch?.axis === 'x') {
    const isFlick = Math.abs(touch.velocity) > 0.25
    const target = isFlick ? (touch.velocity < 0 ? Math.ceil(page.value) : Math.floor(page.value)) : Math.round(page.value)
    page.value = Math.min(Math.max(target, 0), lastPage())
  } else if (touch) {
    // A tap or a vertical drag: carry on to the month it was going to
    page.value = touch.target
  }
  isDragging.value = false
  touch = null
}
// A drag that ends on a day does not pick it
const onClickCapture = (event) => hasDragged && event.stopPropagation()

const getMonthTitle = (date) => (date ? upperFirst(new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(date)) : '')

const weekStartsOn = computed(() => Number(profileStore.weekStartsOn) || 0)
const weekdays = computed(() => {
  const start = startOfWeek(new Date(), { weekStartsOn: weekStartsOn.value })
  return Array.from({ length: 7 }, (_, offset) => new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(addDays(start, offset)))
})

const isOff = (date) => (props.minDate && isBefore(date, startOfDay(props.minDate))) || (props.maxDate && isAfter(date, props.maxDate))

const getLead = (month) => (month.getDay() - weekStartsOn.value + 7) % 7
const getDays = (month) =>
  Array.from({ length: getDaysInMonth(month) }, (_, offset) => {
    const date = addDays(month, offset)
    return {
      date,
      label: offset + 1,
      isOff: isOff(date),
      class: { d: true, today: isSameDay(date, new Date()), on: !!modelValue.value && isSameDay(date, modelValue.value), off: isOff(date) },
    }
  })

const onPick = (date) => {
  modelValue.value = date
  show.value = false
}
</script>
