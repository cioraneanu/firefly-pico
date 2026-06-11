<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('piggy_bank')"
    class=""
    :popup-title="$t('piggy_bank_select')"
    :list="filteredList"
    :columns="appStore.gridColumns"
    :get-display-value="getDisplayValue"
    v-bind="dynamicAttrs"
  >

    <template #left-icon>
      <app-icon :icon="TablerIconConstants.piggyBank" :size="20" />
    </template>

    <template #top-right>
      <van-button size="small" class="" @click="onRefresh">
        <app-icon :icon="TablerIconConstants.refresh" :stroke="1.7" size="14" />
      </van-button>
    </template>

    <template #item="{ item }">
      <app-select-option :text="PiggyBank.getDisplayName(item)" :icon="PiggyBank.getIcon(item) ?? TablerIconConstants.piggyBank" />
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center gap-1">
        <app-icon :icon="PiggyBank.getIcon(item) ?? TablerIconConstants.piggyBank" :size="18" />
        <span class="font-weight-400 text-size-12">{{ getDisplayValue(item) }}</span>
      </div>
    </template>
  </app-select>
</template>

<script setup>
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import { useFormAttributes } from '~/composables/useFormAttributes'

import TablerIconConstants from '~/constants/TablerIconConstants'
import PiggyBank from '~/models/PiggyBank.js'

const piggyBankStore = usePiggyBankStore()
const appStore = useAppStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String
  },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

const list = ref([])

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return PiggyBank.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})


// ------ Methods ------

onMounted(async () => {
  list.value = piggyBankStore.piggyBankList
})

const getDisplayValue = (value) => {
  return PiggyBank.getDisplayName(value)
}

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await piggyBankStore.fetchPiggyBanks()
  list.value = piggyBankStore.piggyBankList
  isLoading.value = false
}
</script>

<style></style>
