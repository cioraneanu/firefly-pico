<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="list.length > 0" v-model="search" :placeholder="$t('category_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <category-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.category" :hint="$t('category_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('category_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useCategoryStore } from '~/core/stores/categoryStore'
import { useList } from '~/core/composables/useList'
import Category from '~/core/models/Category'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const categoryStore = useCategoryStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    categoryStore.categoryList = categoryStore.categoryList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')
const filteredList = computed(() => (search.value ? list.value.filter((item) => LanguageUtils.includesSearch(Category.getDisplayName(item), search.value)) : list.value))

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_CATEGORY_LIST,
  routeForm: RouteConstants.ROUTE_CATEGORY_ID,
  model: new Category(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true
  await categoryStore.fetchCategories()
  isLoading.value = false
  isRefreshing.value = false
  onLoadMore()
}

// The whole list comes from the store, so one load finishes it
const onLoadMore = () => {
  list.value = categoryStore.categoryList
  isFinished.value = true
}

const { t } = useI18n()
useToolbar().init({
  title: t('categories'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
