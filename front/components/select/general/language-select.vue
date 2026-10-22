<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    :label="$t('language_select.label')"
    :popup-title="$t('language_select.title')"
    :list="list"
    :columns="appStore.gridColumns"
    v-bind="dynamicAttrs"
    :has-search="false"
    :clearable="false">
    <template #item="{ item, isActive }">
      <div class="flex flex-col text-12">
        <div class="flex items-center justify-center gap-2 mx-1 flex-wrap">
          <app-icon :icon="item.icon" :size="24" />
          <div class="text-center">{{ item.displayName }}</div>
        </div>
        <div v-if="isActive" class="app-icon-item mt-1.25"/>
      </div>
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex items-center gap-2">
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
