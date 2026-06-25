<template>
  <app-popup v-model:show="showDropdown" :style="style">
      <van-form class="flex-1 display-flex flex-column" style="overflow: hidden" @submit="onApplyFilters">
        <div class="flex-center-vertical m-10 mb-0">
          <div class="flex-1 text-center font-weight-600 text-size-18">{{ $t('filters.transaction_filters') }}</div>
        </div>

        <div ref="popupContentRef" class="flex-1 overflow-hidden" style="padding-bottom: 70px">
          <transaction-filters-content v-model="localModelValue" :show-date="showDate" :show-type="showType" />
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
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'
import { cloneDeep } from 'lodash-es'

const modelValue = defineModel({})
const props = defineProps({
  showDate: { default: true },
  showType: { default: true },
})

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

watch(modelValue, (newValue) => {
  localModelValue.value = cloneDeep(newValue)
}, { immediate: true })

const show = () => {
  showDropdown.value = true
}

const onDismiss = () => {
  showDropdown.value = false
}

const onApplyFilters = () => {
  modelValue.value = localModelValue.value
  showDropdown.value = false
}

const isFiltered = computed(() => {
  return Object.values(localModelValue.value).some((item) => !!item)
})

const onClearFilters = () => {
  localModelValue.value = {}
}

const popupContentRef = ref(null)
useSwipeToDismiss({
  onSwipe: onDismiss,
  swipeRef: popupContentRef,
  showDropdown: showDropdown,
})

defineExpose({ show })
</script>
