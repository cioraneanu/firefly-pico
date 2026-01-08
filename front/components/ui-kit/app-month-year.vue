<template>
  <app-popup v-model:show="showDropdown" round position="bottom" style="height: 50%; padding-top: 4px">
    <div ref="popupRef" class="h-100 display-flex flex-column qqq">
      <div class="van-popup-title flex-center-vertical px-4">
        <div class="flex-1">{{ props.popupTitle }}</div>
        <van-button size="small" @click="onSet">Set</van-button>
      </div>

      <van-date-picker v-model="localModelValue" :columns-type="['year', 'month']" confirm-button-text="" cancel-button-text="" />
    </div>
  </app-popup>
</template>

<script setup>
import { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { isEqual } from 'lodash/lang'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'

const dataStore = useDataStore()

const modelValue = defineModel({
  set: (value) => {
    return DateUtils.stringToDate(`${value[0]}-${value[1]}-01`)
  },
  get: (value) => {
    let result = value ?? new Date()
    return [result.getFullYear(), result.getMonth() + 1]
  },
})

const localModelValue = ref(null)
bindOneWay(modelValue, localModelValue)

const showDropdown = defineModel('showDropdown', false)

const props = defineProps({
  popupTitle: {
    default: 'Choose Month / Year',
  },
})

const onSet = () => {
  if (!isEqual(modelValue.value, localModelValue.value)) {
    modelValue.value = localModelValue.value
  }
  onHideDropdown()
}

const onHideDropdown = () => {
  showDropdown.value = false
}
</script>
