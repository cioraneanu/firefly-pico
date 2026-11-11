<template>
  <app-field v-model="modelValue" v-bind="$attrs" @focus="onFocus" @blur="isFocused = false">
    <template #extra>
      <div v-if="isFocused && dropdownList.length" class="mx-quick" role="listbox">
        <button v-for="item in dropdownList" :key="item" type="button" role="option" class="mx-quick__b" :class="{ on: item === modelValue }" @pointerdown.prevent @click="onSelect(item)">
          {{ item }}
        </button>
      </div>
    </template>
  </app-field>
</template>

<script setup>
import { debounce } from 'lodash-es'

// Text field with suggestions: while focused, matching values from `list` (an array or an async function of the text)
// show as quick buttons under the input.
defineOptions({ inheritAttrs: false })

const modelValue = defineModel()

const props = defineProps({
  list: {},
})

const isFocused = ref(false)
const dropdownList = ref([])

const getList = async () => {
  dropdownList.value = (typeof props.list === 'function' ? await props.list(modelValue.value) : props.list) ?? []
}
const getListWithDebounce = debounce(getList, 500)
watch(modelValue, getListWithDebounce)

const onFocus = () => {
  isFocused.value = true
  getList()
}

const onSelect = (item) => {
  modelValue.value = item
}
</script>
