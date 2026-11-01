<template>
  <d-page :title="$t('categories')" :description="$t('desktop.categories_description')">
    <template #actions>
      <d-refresh-button :action="categoryStore.fetchCategories" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_CATEGORY_ID">{{ $t('category_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="category in filtered"
        :key="category.id"
        :title="Category.getDisplayName(category)"
        :icon="Category.getIcon(category) ?? IconCategory"
        :to="`${RouteConstants.ROUTE_CATEGORY_ID}/${category.id}`"
        :active="category.id === id"
      />
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconCategory" />
    </d-list>

    <d-category-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconCategory, IconPlus } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Category from '~/core/models/Category'
import { sortByPath } from '~/core/utils/DataUtils'

const categoryStore = useCategoryStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_CATEGORY_LIST)
const { search, filtered } = useSearch(() => sortByPath([...categoryStore.categoryList], 'attributes.name'), Category.getDisplayName)
</script>
