<template>
  <app-select v-model="modelValue" :label="label ?? $t('category')" :popup-title="$t('category_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
        <span v-if="isLoading" class="mx-spin" />
        <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
      </button>
    </template>
  </app-select>
</template>

<script setup>
import { IconRefresh } from '@tabler/icons-vue'
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

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await store.fetchCategories()
  isLoading.value = false
}
</script>
