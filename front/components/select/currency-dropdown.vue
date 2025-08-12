<template>
  <div class="currency-dropdown">
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
    <icon-square-rounded-x v-if="modelValue && isClearable" :size="20" :stroke="1.5" @click="modelValue = null" />
  </div>

</template>

<script setup>
import _, { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { IconCaretDown, IconSquareRoundedX } from '@tabler/icons-vue'
import Currency from '~/models/Currency'

const dataStore = useDataStore()
const showPopover = ref(false)
const modelValue = defineModel()
const props = defineProps({
  isClearable: {
    default: false,
  }
})
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
