<template>
  <van-popover v-model:show="showPopover" theme="dark" :actions="actions">
    <template #reference>
      <van-button type="primary">{{  }}</van-button>
    </template>
  </van-popover>
</template>

<script setup>
import _, { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { IconRefresh } from '@tabler/icons-vue'

import Currency from '~/models/Currency'
import TablerIconConstants from '~/constants/TablerIconConstants'

const dataStore = useDataStore()

const showPopover = ref(false)
const modelValue = defineModel()
let list = ref([])


const currencyCode = computed(() => {})

// ------ Methods ------

onMounted(async () => {
  list.value = dataStore.currenciesList.filter((item) => get(item, 'attributes.enabled'))
})

const getDisplayValue = (value) => {
  return Currency.getDisplayName(value)
}

const isLoading = ref(false)
UIUtils.showLoadingWhen(isLoading)
const onRefresh = async () => {
  isLoading.value = true
  await dataStore.fetchCurrencies()
  isLoading.value = false
}
</script>

<style></style>
