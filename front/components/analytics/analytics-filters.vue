<template>
  <app-popup v-model:show="showDropdown" :style="style">
    <van-form class="flex-1 display-flex flex-column" style="overflow: hidden" @submit="onApplyFilters">
      <div class="flex-center-vertical m-10 mb-0">
        <div class="flex-1 text-center font-weight-600 text-size-18">{{ $t('analytics.filters.title') }}</div>
      </div>

      <div ref="popupContentRef" class="flex-1 overflow-hidden" style="padding-bottom: 70px">
        <analytics-filters-content v-model="localModelValue" />
      </div>

      <app-button-form-save :label="$t('filters.apply_filters')" bottom=" - var(--van-tabbar-height) + 20px">
        <template #left>
          <van-button v-if="isFiltered" round @click="onClearFilters">{{ $t('filters.clear') }}</van-button>
        </template>
      </app-button-form-save>
    </van-form>
  </app-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'
import { useAnalyticsFilters } from '~/composables/useAnalyticsFilters'
import { analyticsFilterDimensionKeys, analyticsFilterModes } from '~/utils/AnalyticsFilterUtils'

const { filterState } = useAnalyticsFilters()

const localModelValue = ref({})
const showDropdown = ref(false)
const appStore = useAppStore()

const style = computed(() => {
  if (appStore.isDesktopLayout) {
    return { overflow: 'hidden', display: 'flex', flexDirection: 'column' }
  }
  return {
    height: '90%',
    'padding-top': '4px',
    'border-radius': '0px',
    display: 'flex',
    flexDirection: 'column',
  }
})

function emptyBag() {
  return analyticsFilterDimensionKeys.reduce((bag, key) => {
    bag[`${key}Selected`] = []
    bag[`${key}Mode`] = analyticsFilterModes.include
    return bag
  }, {})
}

function bagFromState() {
  return analyticsFilterDimensionKeys.reduce((bag, key) => {
    bag[`${key}Selected`] = [...filterState[key].selected.value]
    bag[`${key}Mode`] = filterState[key].mode.value
    return bag
  }, {})
}

const show = () => {
  localModelValue.value = bagFromState()
  showDropdown.value = true
}

const onDismiss = () => {
  showDropdown.value = false
}

const onApplyFilters = () => {
  for (const key of analyticsFilterDimensionKeys) {
    filterState[key].selected.value = localModelValue.value[`${key}Selected`] ?? []
    filterState[key].mode.value = localModelValue.value[`${key}Mode`] ?? analyticsFilterModes.include
  }
  showDropdown.value = false
}

const isFiltered = computed(() => analyticsFilterDimensionKeys.some((key) => (localModelValue.value[`${key}Selected`] ?? []).length > 0))

const onClearFilters = () => {
  localModelValue.value = emptyBag()
}

const popupContentRef = ref(null)
useSwipeToDismiss({
  onSwipe: onDismiss,
  swipeRef: popupContentRef,
  showDropdown: showDropdown,
})

defineExpose({ show })
</script>
