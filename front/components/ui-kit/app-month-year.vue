<template>
  <van-popup v-model:show="showDropdown" round position="bottom" style="height: 90%; padding-top: 4px">
    <div ref="popupRef" class="h-100 display-flex flex-column qqq">
      <div v-if="props.popupTitle" class="van-popup-title">{{ props.popupTitle }}</div>

      <van-date-picker v-model="modelValue" :columns-type="['year', 'month']" />
    </div>
  </van-popup>
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
    return [value.getFullYear(), value.getMonth()]
  },
})
const showDropdown = defineModel('showDropdown', false)

const props = defineProps({
  popupTitle: {
    default: 'Choose Month / Year',
  }
})

const onHideDropdown = () => {
  showDropdown.value = false
}

// useSwipeToDismiss({
//   onSwipe: onHideDropdown,
//   swipeRef: popupContentRef,
//   showDropdown: showDropdown,
// })
</script>

