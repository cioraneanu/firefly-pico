<template>
  <app-select
    :label="$t('language_select.label')"
    :popupTitle="$t('language_select.title')"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="appStore.gridColumns"
    v-bind="dynamicAttrs"
    :has-search="false"
    :clearable="false"
  >
    <template #item="{ item, isActive }">
      <div class="display-flex flex-column text-size-12">
        <div class="flex-center-vertical gap-2 mx-1">
          <app-icon :icon="item.icon" :size="24" />
          {{ item.displayName }}
        </div>
        <div v-if="isActive" class="app-icon-item mt-5"></div>
      </div>
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center-vertical gap-2">
        <app-icon :icon="item.icon" :size="18" />
        {{ item.displayName }}
      </div>
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { format, startOfWeek, addDays } from 'date-fns'
import { supportedLanguages } from '~/i18n/index.js'
import Category from '~/models/Category.js'

const appStore = useAppStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

// Internally use the language object, externaly use just the code: "en"
const modelValue = defineModel({
  set: (value) => {
    return value.code
  },
  get: (value) => {
    return list.value.find((item) => item.code === value)
  },
})

const list = computed(() => supportedLanguages)

const showDropdown = ref(null)
</script>
