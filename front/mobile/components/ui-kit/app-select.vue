<template>
  <div class="mx-f" :class="{ bad: !!error }">
    <slot name="label">
      <div v-if="label" class="mx-l">{{ label }}<span v-if="isRequired" class="req">*</span></div>
    </slot>

    <div class="mx-sel" :class="{ dis: disabled }" role="button" tabindex="0" aria-haspopup="dialog" :aria-label="label" :name="name" @click.stop="onOpen" @keydown.enter.prevent="onOpen">
      <span class="val">
        <slot name="input" :items="selectedItems">
          <span v-if="isEmpty" class="ph">{{ placeholder ?? $t('select_is_empty') }}</span>
          <template v-else-if="isMultiSelect">
            <span v-for="item in selectedItems" :key="getKey(item)" class="mx-chip">
              <slot name="inputItemContent" :item="item">
                <app-icon v-if="getIcon(item)" :icon="getIcon(item)" :size="13" :stroke="2" />
                <span>{{ getDisplayName(item) }}</span>
              </slot>
            </span>
          </template>
          <template v-else>
            <slot name="inputItemContent" :item="modelValue">
              <app-icon v-if="getIcon(modelValue)" :icon="getIcon(modelValue)" :size="16" :stroke="2" />
              <span class="tx min-w-0 truncate">{{ getDisplayName(modelValue) }}</span>
              <span v-if="getMeta(modelValue)" class="mx-muted text-13">{{ getMeta(modelValue) }}</span>
            </slot>
          </template>
        </slot>
      </span>
      <button v-if="!isEmpty && isClearable && !disabled" type="button" class="x" :aria-label="$t('clear')" @click.stop="onClear">
        <app-icon :icon="IconX" :size="14" :stroke="2" />
      </button>
      <span class="chev"><app-icon :icon="IconSelector" :size="16" :stroke="2" /></span>
    </div>

    <div v-if="error" class="mx-ferr">{{ error }}</div>
    <slot name="extra" />

    <app-sheet v-model:show="showDropdown" v-model:search="search" :title="popupTitle ?? label" :searchable="isSearchVisible" :full="full">
      <template v-if="$slots['top-right']" #header-right>
        <slot name="top-right" />
      </template>

      <slot name="popup" :on-select-cell="onSelectCell" :list="filteredList" :is-item-selected="isItemSelected">
        <div v-if="grid" class="mx-ogrid">
          <button
            v-for="(item, index) in filteredList"
            :key="getKey(item, index)"
            type="button"
            :class="{ on: isItemSelected(item) }"
            :aria-label="getDisplayName(item)"
            :aria-pressed="isItemSelected(item)"
            @click="onSelectCell(item)"
          >
            <slot name="item" :item="item" :is-active="isItemSelected(item)">
              <app-icon :icon="getIcon(item)" :size="22" :stroke="1.75" />
            </slot>
          </button>
        </div>
        <template v-else>
          <button
            v-for="(item, index) in filteredList"
            :key="getKey(item, index)"
            type="button"
            class="mx-opt"
            :class="{ on: isItemSelected(item) }"
            :aria-pressed="isItemSelected(item)"
            @click="onSelectCell(item)"
          >
            <span v-if="isMultiSelect" class="mx-ck" :class="{ on: isItemSelected(item) }"><app-icon :icon="IconCheck" :size="14" :stroke="3" /></span>
            <slot name="item" :item="item" :is-active="isItemSelected(item)">
              <span v-if="getIcon(item)" class="ic"><app-icon :icon="getIcon(item)" :size="16" :stroke="2" /></span>
              <span class="lb">{{ getDisplayName(item) }}</span>
              <span v-if="getMeta(item)" class="mt">{{ getMeta(item) }}</span>
            </slot>
            <span v-if="!isMultiSelect" class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
          </button>
        </template>
        <div v-if="filteredList.length === 0" class="mx-none">{{ $t('no_matches') }}</div>
      </slot>

      <template v-if="isMultiSelect" #footer>
        <button type="button" class="mx-btn out" @click="onClear">{{ $t('clear') }}</button>
        <button type="button" class="mx-btn pri" @click="showDropdown = false">{{ $t('done') }}</button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { get, isEqual } from 'lodash-es'
import { IconCheck, IconSelector, IconX } from '@tabler/icons-vue'
import LanguageUtils from '~/core/utils/LanguageUtils'

// Picker of the mobile kit: a .mx-sel trigger that opens a bottom sheet. List rows (.mx-opt) by default,
// an icon grid with `grid`, checkboxes + Done with `isMultiSelect`. Search appears above 7 options.
const modelValue = defineModel()
const showDropdown = defineModel('showDropdown', { type: Boolean, default: false })
const search = defineModel('search', { type: String, default: '' })

const props = defineProps({
  label: { type: String, default: null },
  name: { type: String, default: null },
  popupTitle: { type: String, default: null },
  placeholder: { type: String, default: null },
  list: { type: Array, default: () => [] },
  getDisplayValue: { type: Function, default: null },
  getIconValue: { type: Function, default: null },
  getMetaValue: { type: Function, default: null },
  hasSearch: { type: Boolean, default: null },
  isMultiSelect: { type: Boolean, default: false },
  grid: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  // Accepted for older call sites (the Vant grid layout); the sheet now picks its own layout
  columns: { default: null },
  teleport: { default: null },
  zIndex: { default: null },
})

const { error, isRequired } = useFormField({ name: () => props.name, rules: () => props.rules, value: modelValue })

const isClearable = computed(() => props.clearable)
const isSearchVisible = computed(() => props.hasSearch ?? props.list.length > 7)

const getDisplayName = (item) => {
  if (props.getDisplayValue) {
    return props.getDisplayValue(item)
  }
  return typeof item === 'string' || typeof item === 'number' ? item : get(item, 'name', get(item, 'attributes.name', ''))
}
const getIcon = (item) => (props.getIconValue ? props.getIconValue(item) : get(item, 'icon', null))
const getMeta = (item) => (props.getMetaValue ? props.getMetaValue(item) : null)
const getKey = (item, index) => get(item, 'id', null) ?? `${getDisplayName(item)}-${index ?? ''}`

const filteredList = computed(() => {
  if (!search.value) {
    return props.list
  }
  return props.list.filter((item) => LanguageUtils.includesSearch(String(getDisplayName(item) ?? ''), search.value))
})

const isEmpty = computed(() => (props.isMultiSelect ? !modelValue.value || modelValue.value.length === 0 : modelValue.value === null || modelValue.value === undefined || modelValue.value === ''))
const selectedItems = computed(() => (isEmpty.value ? [] : props.isMultiSelect ? modelValue.value : [modelValue.value]))

const isItemSelected = (option) => {
  if (isEmpty.value) {
    return false
  }
  return props.isMultiSelect ? modelValue.value.some((item) => isEqual(item, option)) : isEqual(modelValue.value, option)
}

const onSelectCell = (item) => {
  if (props.isMultiSelect) {
    const current = modelValue.value ?? []
    modelValue.value = current.some((value) => isEqual(item, value)) ? current.filter((value) => !isEqual(item, value)) : [...current, item]
    return
  }
  modelValue.value = isEqual(modelValue.value, item) && isClearable.value ? null : item
  showDropdown.value = false
}

const onClear = () => {
  modelValue.value = props.isMultiSelect ? [] : null
}

const onOpen = () => {
  if (!props.disabled) {
    search.value = ''
    showDropdown.value = true
  }
}
</script>
