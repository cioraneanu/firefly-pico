<template>
  <van-popup v-model:show="showDropdown" round position="bottom" style="height: 90%; padding-top: 4px">
    <div ref="popupRef" class="h-100 display-flex flex-column qqq">
      <div class="van-popup-title">Select a template</div>

      <div style="margin-right: 12px" class="p-1 flex-center-vertical gap-1">
        <van-search v-model="search" placeholder="Search..." class="flex-1" />

        <slot name="top-right"></slot>
      </div>

      <div ref="popupContentRef" class="flex-1 flex-column overflow-auto">
        <slot name="popup">
          <van-grid :column-num="columns">
            <template v-for="(item, index) in list" :key="index">
              <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                <template #default>
                  <app-select-option :text="TransactionTemplate.getDisplayName(item)" :icon="TablerIconConstants.transactionTemplate" />
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </slot>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { usePointerSwipe, useScroll } from '@vueuse/core'
import { isEqual } from 'lodash/lang'

import TransactionTemplate from '~/models/TransactionTemplate'
import TablerIconConstants from '~/constants/TablerIconConstants'

const dataStore = useDataStore()

const modelValue = defineModel()
const showDropdown = defineModel('show')
const search = defineModel('search')

const popupRef = ref(null)
const popupContentRef = ref(null)

const isItemSelected = (option) => {
  if (!modelValue.value) {
    return false
  }
  if (props.isMultiSelect) {
    return modelValue.value.some((item) => isEqual(item, option))
  }
  return isEqual(modelValue.value, option)
}

const getOptionClass = (option) => {
  return {
    active: isItemSelected(option),
  }
}

let isScrollOnTop = false
const { x, y } = useScroll(popupContentRef)

const { distanceY } = usePointerSwipe(popupRef, {
  disableTextSelect: true,
  onSwipe(e) {
    if (y.value === 0) {
      isScrollOnTop = true
    }
  },
  onSwipeEnd(e, direction) {
    if (distanceY.value < -100 && isScrollOnTop) {
      showDropdown.value = false
    }
    isScrollOnTop = false
  },
})

const props = defineProps({
  columns: {
    default: 3,
  },
})

let list = ref([])

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const fieldClass = computed(() => {
  return {
    'app-field': true,
    empty: !modelValue.value,
  }
})

const modelValueDisplayName = computed(() => {
  if (!modelValue.value) {
    return null
  }
  return getDisplayName(modelValue.value)
})

const isEmpty = computed(() => {
  if (props.isMultiSelect) {
    return !modelValue.value || modelValue.value.length === 0
  }
  return !modelValue.value
})

const modelValueList = computed(() => {
  if (isEmpty.value) {
    return []
  }
  if (!props.isMultiSelect) {
    return [modelValue.value]
  }
  return modelValue.value
})

const getDisplayName = (item) => {
  return get(item, 'name')
}

const onSelectCell = (item) => {
  if (props.isMultiSelect) {
    let newValue = modelValue.value ?? []
    let isSelected = newValue.some((value) => isEqual(item, value))
    if (isSelected) {
      newValue = newValue.filter((value) => !isEqual(item, value))
    } else {
      newValue = [...newValue, item]
    }
    modelValue.value = newValue
  } else {
    modelValue.value = item
    showDropdown.value = false
  }
}

const onClear = () => {
  modelValue.value = props.isMultiSelect ? [] : null
}

onMounted(async () => {
  list.value = dataStore.transactionTemplateList
})

const onShowDropdown = () => {
  showDropdown.value = true
}
</script>

<style>
.empty .van-field__control {
  color: #ddd;
}
</style>
