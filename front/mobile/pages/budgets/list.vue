<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="list.length > 0" v-model="search" :placeholder="$t('budget_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <budget-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.budget" :hint="$t('budget_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('budget_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useBudgetStore } from '~/core/stores/budgetStore'
import { useList } from '~/core/composables/useList'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'
import Budget from '~/core/models/Budget.js'

const budgetStore = useBudgetStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    budgetStore.budgetList = budgetStore.budgetList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')

const sortedList = computed(() => [...list.value].sort((a, b) => b.attributes?.active - a.attributes?.active))
const filteredList = computed(() => (search.value ? sortedList.value.filter((item) => LanguageUtils.includesSearch(Budget.getDisplayName(item), search.value)) : sortedList.value))

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_BUDGET_LIST,
  routeForm: RouteConstants.ROUTE_BUDGET_ID,
  model: new Budget(),
  onEvent: onEvent,
})

// The whole list is fetched in one go, so one load finishes it
const onRefresh = async () => {
  if (isLoading.value) {
    isRefreshing.value = false
    return
  }
  isLoading.value = true
  isRefreshing.value = true

  await budgetStore.fetchBudgets()
  list.value = budgetStore.budgetList

  isFinished.value = true
  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = () => onRefresh()

const { t } = useI18n()
useToolbar().init({
  title: t('budgets'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
