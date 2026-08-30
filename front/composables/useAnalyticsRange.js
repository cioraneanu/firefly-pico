import { useProfileStore } from '~/stores/profileStore'
import { getActiveFilters, getFiltersFromURL, saveToUrl } from '~/utils/FilterUtils'
import { animateOnNext, animateOnPrevious } from '~/utils/AnimationUtils.js'
import DateUtils from '~/utils/DateUtils.js'
import { rangePreset, rangePresetList, resolveRange, shiftRange, eachFinancialMonth, rangeLabel } from '~/utils/DateRangeUtils'
import { useAnalyticsFilters } from '~/composables/useAnalyticsFilters'

const rangeFilterDefinitions = [
  { bagKey: 'preset', filter: () => null, display: () => null, toUrl: (value) => `range=${value}`, fromUrl: () => useRoute().query?.range },
  { bagKey: 'customStart', filter: () => null, display: () => null, toUrl: (value) => `start=${DateUtils.dateToString(value)}`, fromUrl: () => DateUtils.stringToDate(useRoute().query?.start) },
  { bagKey: 'customEnd', filter: () => null, display: () => null, toUrl: (value) => `end=${DateUtils.dateToString(value)}`, fromUrl: () => DateUtils.stringToDate(useRoute().query?.end) },
]

// Module-level (not inside useAnalyticsRange) so every component calling this composable
// shares the same range state without prop-drilling — the same pattern useToolbar.js uses
// for its singleton title/subtitle refs.
const presetCode = ref(rangePreset.last12Months.code)
const customStart = ref(null)
const customEnd = ref(null)
const showRangePopup = ref(false)

// useRoute() needs an active component/Nuxt context, so the URL can't be read at module
// top-level (that runs at import time, before any context exists) — hydrate lazily on the
// first call to useAnalyticsRange() instead, which always happens inside setup().
let hasHydratedFromUrl = false

export const useAnalyticsRange = () => {
  const profileStore = useProfileStore()

  // useAnalyticsRange.js is the single writer of this page's URL query string. FilterUtils.saveToUrl
  // fully replaces the query object rather than merging (front/utils/FilterUtils.js:43-57), so a
  // second, independent saveToUrl caller (e.g. inside useAnalyticsFilters itself) would race this
  // watcher and strip whichever wrote last. See ANALYTICS_PLAN.md Part 3.
  const { filterState, activeUrlFilters } = useAnalyticsFilters()

  if (!hasHydratedFromUrl) {
    hasHydratedFromUrl = true
    const initial = getFiltersFromURL(rangeFilterDefinitions)
    if (initial.preset && rangePreset[initial.preset]) presetCode.value = initial.preset
    if (initial.customStart) customStart.value = initial.customStart
    if (initial.customEnd) customEnd.value = initial.customEnd
  }

  const firstDayOfMonth = computed(() => profileStore.dashboard.firstDayOfMonth)

  const range = computed(() =>
    resolveRange(presetCode.value, new Date(), firstDayOfMonth.value, presetCode.value === rangePreset.custom.code ? { start: customStart.value, end: customEnd.value } : null),
  )
  const months = computed(() => eachFinancialMonth(range.value.start, range.value.end, firstDayOfMonth.value))
  const priorRange = computed(() => shiftRange(range.value, -months.value.length, firstDayOfMonth.value))
  const priorMonths = computed(() => eachFinancialMonth(priorRange.value.start, priorRange.value.end, firstDayOfMonth.value))
  const rangeTitle = computed(() => rangeLabel(range.value))

  function setPreset(code) {
    presetCode.value = code
    showRangePopup.value = false
  }

  function setCustomRange({ start, end }) {
    customStart.value = start
    customEnd.value = end
    presetCode.value = rangePreset.custom.code
    showRangePopup.value = false
  }

  function onNext() {
    const shifted = shiftRange(range.value, months.value.length, firstDayOfMonth.value)
    customStart.value = shifted.start
    customEnd.value = shifted.end
    presetCode.value = rangePreset.custom.code
    animateOnNext()
  }

  function onPrevious() {
    const shifted = shiftRange(range.value, -months.value.length, firstDayOfMonth.value)
    customStart.value = shifted.start
    customEnd.value = shifted.end
    presetCode.value = rangePreset.custom.code
    animateOnPrevious()
  }

  const filterWatchRefs = Object.values(filterState).flatMap((dimension) => [dimension.selected, dimension.mode])

  watch([presetCode, customStart, customEnd, ...filterWatchRefs], () => {
    const isCustom = presetCode.value === rangePreset.custom.code
    const activeFilters = getActiveFilters(rangeFilterDefinitions, {
      preset: presetCode.value,
      customStart: isCustom ? customStart.value : null,
      customEnd: isCustom ? customEnd.value : null,
    })
    saveToUrl([...activeFilters, ...activeUrlFilters()])
  })

  return {
    showRangePopup,
    presetCode,
    rangePresetList,
    range,
    months,
    priorMonths,
    rangeTitle,
    setPreset,
    setCustomRange,
    onNext,
    onPrevious,
  }
}
