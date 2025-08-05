<template>
  <van-popup v-model:show="modelValueShow" round position="bottom" style="padding-top: 4px">
    <div ref="popupRef" class="h-100 display-flex flex-column app-date-time-grid">
        <van-time-picker v-if="localModelValue" v-model="localModelValue" @confirm="onClose" @cancel="onClose" />
    </div>
  </van-popup>
</template>

<script setup>
import { isEqual } from 'lodash'

const modelValueShow = defineModel('show')
const modelValue = defineModel()

const localModelValue = ref(null)

watch(
  modelValue,
  (newValue, oldValue) => {
    if (isEqual(newValue, oldValue) || !newValue) {
      return
    }
    localModelValue.value = newValue.split(':')
  },
  { immediate: true },
)

watch(localModelValue, (newValue, oldValue) => {
  if (isEqual(newValue, oldValue)) {
    return
  }
  modelValue.value = newValue.join(':')
})

const onClose = () => {
  modelValueShow.value = false
}
</script>
