<template>
  <d-select
    v-model="model"
    :options="categoryStore.categoryList"
    :get-label="(item) => Category.getDisplayName(item)"
    :get-icon="(category) => Category.getIcon(category) ?? IconCategory"
    :icon="IconCategory"
    :placeholder="$t('category_select')"
    clearable
  />
</template>

<script setup>
import { IconCategory } from '@tabler/icons-vue'
import Category from '~/core/models/Category'

const model = defineModel()
const categoryStore = useCategoryStore()
</script>
