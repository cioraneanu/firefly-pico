<template>
  <van-popover v-model:show="showPopover" placement="bottom-start">
    <van-cell-group>
      <van-cell v-for="item in dropdownList" :key="item" :title="item" @click="onSelect(item)" />
    </van-cell-group>

    <template #reference>
      <app-field v-model="modelValue" v-bind="$attrs" @focus="isFocused = true" @blur="isFocused = false" @click.stop.prevent />
    </template>
  </van-popover>
</template>

<script setup>
import { ref, computed } from 'vue'
import { debounce } from 'lodash/function'

const modelValue = defineModel()
const showPopover = ref(false)
const isFocused = ref(false)
const dropdownList = ref([])

const props = defineProps({
  list: {},
})


const getListWithDebounce = debounce(async () => {
  dropdownList.value = typeof props.list === 'function' ? await props.list(modelValue.value) : props.list
  console.log('after debounce', dropdownList.value)
}, 500)

watch(modelValue, (newValue) => {
  getListWithDebounce()
})

watch([isFocused, dropdownList], () => {
  showPopover.value = isFocused.value && dropdownList.value.length > 0
})
const onSelect = (item) => {
  modelValue.value = item
  showPopover.value = false
}
</script>
