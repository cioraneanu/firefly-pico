<template>
  <app-select v-model="modelValue" :label="label ?? $t('category')" :popup-title="$t('category_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <app-refresh-button :refresh="store.fetchCategories" />
    </template>
  </app-select>
</template>

<script setup>
import { useCategoryStore } from '~/core/stores/categoryStore'
import Category from '~/core/models/Category'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

defineProps({
  label: { type: String },
})

const store = useCategoryStore()
const modelValue = defineModel()

const list = computed(() => store.categoryList)

const getDisplayValue = (value) => Category.getDisplayName(value)
const getIcon = (value) => Category.getIcon(value) ?? TablerIconConstants.category
</script>
