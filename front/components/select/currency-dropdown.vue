<template>
  <van-popover v-model:show="showPopover" :actions="list" @select="onSelect" >
    <template #reference>
      <div class="flex-center-vertical gap-1" :class="$attrs.class">
        {{ currencyCode }}
        <icon-caret-down :size="18" />
      </div>
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
import { IconCaretDown } from '@tabler/icons-vue'
import Currency from '~/models/Currency'

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
