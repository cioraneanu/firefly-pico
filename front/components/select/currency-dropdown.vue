<template>
  <van-popover v-model:show="showPopover" :actions="list" @select="onSelect">
    <template #reference>
      <van-button type="success" size="small">{{ currencyCode }}</van-button>
    </template>

    <template #action="{ action }">
      {{ Currency.getCode(action) }}
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

const currencyCode = computed(() => Currency.getCode(modelValue.value))

// ------ Methods ------

onMounted(async () => {
  list.value = dataStore.currenciesList.filter((item) => get(item, 'attributes.enabled'))
})

const onSelect = (item) => {
  modelValue.value = item
}
</script>

<style></style>
