<template>
  <app-sheet v-model:show="showDropdown" :title="$t('filters.transaction_filters')" full>
    <template #header-right>
      <span v-if="activeCount > 0" class="mx-badge">{{ $t('transaction_list_page.active_count', { count: activeCount }) }}</span>
    </template>

    <transaction-filters-content v-model="localModelValue" :show-date="showDate" :show-type="showType" />

    <template #footer>
      <button type="button" class="mx-btn out" @click="onClearFilters">{{ $t('filters.clear') }}</button>
      <button type="button" class="mx-btn pri" @click="onApplyFilters">{{ $t('filters.apply_filters') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
import { cloneDeep } from 'lodash-es'

// The sheet edits a copy of the filters; they apply on "Apply filters".
defineOptions({ inheritAttrs: false })

const modelValue = defineModel({})
defineProps({
  showDate: { default: true },
  showType: { default: true },
})

const localModelValue = ref({})
const showDropdown = ref(false)

watch(
  modelValue,
  (newValue) => {
    localModelValue.value = cloneDeep(newValue)
  },
  { immediate: true },
)

const show = () => {
  showDropdown.value = true
}

const onApplyFilters = () => {
  modelValue.value = localModelValue.value
  showDropdown.value = false
}

const activeCount = computed(() => Object.values(localModelValue.value ?? {}).filter((item) => !!item).length)

const onClearFilters = () => {
  localModelValue.value = {}
}

defineExpose({ show })
</script>
