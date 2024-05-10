<template>
  <div class="van-cell-fake">
    <van-field
      :model-value="modelValueDisplayName"
      :class="fieldClass"
      :label="label"
      :placeholder="props.placeholder"
      v-bind="dynamicAttrs"
      @click.stop="onShowDropdown"
      is-link
      readonly
    >
      <template v-if="$slots.label" #label>
        <slot name="label" />
      </template>

      <template #right-icon>
        <div>
          <van-icon v-if="modelValue && isClearable" @click.prevent.stop="onClear" name="clear" />
        </div>
      </template>

      <!--      <template #input v-if="isMultiSelect">-->
      <template #input>
        <slot name="input">
          <div v-if="isEmpty" class="text-muted">No selection...</div>
          <div class="display-flex flex-wrap" style="gap: 4px">
            <div v-for="item in modelValueList" class="app-select-option-tag flex-center-vertical gap-2">
              <slot name="inputItemContent" :item="item">
                <span class="font-weight-400 text-size-12">{{ getDisplayName(item) }}</span>
              </slot>
              <van-icon
                v-if="isClearable"
                :size="16"
                style="color: #888"
                @click.prevent.stop="onSelectCell(item)"
                name="clear"
              />
            </div>
          </div>
        </slot>
      </template>
    </van-field>

    <van-popup v-model:show="showDropdown" round position="bottom" style="height: 90%; padding-top: 4px">
      <div ref="popupRef" class="h-100 display-flex flex-column qqq">
        <div v-if="props.popupTitle" class="van-popup-title">{{ props.popupTitle }}</div>

        <div v-if="hasSearch" style="margin-right: 12px" class="p-1 flex-center-vertical gap-1">
          <van-search v-model="search" placeholder="Search..." class="flex-1" />

          <slot name="top-right"></slot>
        </div>

        <div ref="popupContentRef" class="flex-1 flex-column overflow-auto mt-20">
          <slot name="popup" :onSelectCell="onSelectCell">
            <van-grid :column-num="columns">
              <template v-for="(item, index) in list" :key="index">
                <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                  <template #default>
                    <slot name="item" :item="item">
                      <!--                      <div class="">-->
                      <!--                      {{ getDisplayName(item) }}-->
                      <!--                      </div>-->

                      <app-select-option :text="getDisplayName(item)" />
                    </slot>
                  </template>
                </van-grid-item>
              </template>
            </van-grid>
          </slot>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { isEqual } from 'lodash/lang'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'

const dataStore = useDataStore()

const modelValue = defineModel()
const showDropdown = defineModel('showDropdown', false)
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

// let isScrollOnTop = false
// const { x, y } = useScroll(popupContentRef)
//
// const { lengthY: swipeYDistance } = useSwipe(popupRef, {
//   onSwipe (e) {
//     if (y.value === 0) {
//       isScrollOnTop = true
//     }
//   },
//   onSwipeEnd (e, direction) {
//     if (swipeYDistance.value < -100 && isScrollOnTop) {
//       showDropdown.value = false
//     }
//     isScrollOnTop = false
//   },
// })

const props = defineProps({
  label: {
    type: String,
    default: 'Date',
  },
  popupTitle: {},
  placeholder: {
    default: 'No value selected',
  },
  list: {},
  columns: {
    default: 3,
  },
  getDisplayValue: {},
  hasSearch: {
    default: true,
  },
  isMultiSelect: {
    default: false,
  },
})

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const isClearable = computed(() => !('clearable' in attrs) || get(attrs, 'clearable'))

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
  if (props.getDisplayValue) {
    return props.getDisplayValue(item)
  }

  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'number') {
    return item
  }

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
    modelValue.value = isEqual(modelValue.value, item) ? null : item
    showDropdown.value = false
  }
}

const onClear = () => {
  modelValue.value = props.isMultiSelect ? [] : null
}

const onShowDropdown = () => {
  if (attrs.disabled) {
    return
  }
  showDropdown.value = true
}

const onHideDropdown = () => {
  showDropdown.value = false
}

useSwipeToDismiss({
  onSwipe: onHideDropdown,
  swipeRef: popupContentRef,
  showDropdown: showDropdown,
})
</script>

<style>
.empty .van-field__control {
  color: #ddd;
}
</style>
