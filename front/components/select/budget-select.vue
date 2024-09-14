<template>
  <app-select
    :label="label"
    class=""
    popupTitle="Select a budget"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    v-model:search="search"
    :list="filteredList"
    :columns="3"
    :getDisplayValue="getDisplayValue"
    v-bind="dynamicAttrs"
  >

    <template #left-icon>
      <app-icon :icon="TablerIconConstants.budget" :size="20" />
    </template>

    <template #top-right>
      <van-button size="small" @click="onRefresh" class="">
        <app-icon :icon="TablerIconConstants.refresh" :stroke="1.7" size="14" />
      </van-button>
    </template>

    <template #item="{ item }">
      <app-select-option :text="Budget.getDisplayName(item)" :icon="Budget.getIcon(item) ?? TablerIconConstants.budget" />
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center gap-1">
        <app-icon :icon="Budget.getIcon(item) ?? TablerIconConstants.budget" :size="18" />
        <span class="font-weight-400 text-size-12">{{ getDisplayValue(item) }}</span>
      </div>
    </template>
  </app-select>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { IconRefresh } from '@tabler/icons-vue'

import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '~/models/Tag.js'
import Budget from '~/models/Budget.js'

const dataStore = useDataStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
    default: 'Budget',
  },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

let list = ref([])

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return Budget.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

const budgetList = computed(() => {
  if (search.value.length === 0) {
    return dataStore.budgetList
  }
  return dataStore.budgetList.filter((item) => {
    return Budget.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

// ------ Methods ------

onMounted(async () => {
  list.value = dataStore.budgetList
})

const onSelectCell = (value) => {
  modelValue.value = value
  showDropdown.value = false
}

const getDisplayValue = (value) => {
  return Budget.getDisplayName(value)
}

const isLoading = ref(false)
UIUtils.showLoadingWhen(isLoading)
const onRefresh = async () => {
  isLoading.value = true
  await dataStore.fetchBudgets()
  isLoading.value = false
}
</script>

<style></style>
