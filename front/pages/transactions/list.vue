<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <div class="flex-center-vertical gap-1">
          <div @click.prevent.stop="onShowFilters" class="mr-10">
            <app-icon :icon="TablerIconConstants.search" size="20" :stroke="1.6" />
          </div>

          <app-button-list-add @click="onAdd" />
        </div>
      </template>
    </app-top-toolbar>

    <div class="applied-filters-container" v-if="filtersDisplayList.length > 0">
      <div class="flex-center-vertical">
        <div class="title flex-1">{{ $t('filters.applied_filters') }}</div>
      </div>

      <div class="display-flex flex-wrap gap-1">
        <div v-for="appliedFilter in filtersDisplayList" class="tag-filter">
          <span class="ml-5">{{ appliedFilter }}</span>
        </div>
        <div @click="onClearFilters" style="z-index: 2">
          <icon-square-rounded-x :size="26" :stroke="1.5" />
        </div>
      </div>
    </div>

    <empty-list v-if="isEmpty && !isLoading" />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <transaction-list-item v-for="item in list" :key="item.id" :value="item" @onEdit="onEdit" @onDelete="onDelete" />
      </van-list>
    </van-pull-refresh>

    <transaction-filters ref="transactionFiltersRef" v-model="filters" />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useList } from '~/composables/useList'
import Transaction from '~/models/Transaction'
import { useToolbar } from '~/composables/useToolbar'
import EmptyList from '~/components/general/empty-list.vue'
import { ref } from 'vue'
import TransactionRepository from '~/repository/TransactionRepository'
import Tag from '~/models/Tag.js'
import Account from '~/models/Account.js'
import Category from '~/models/Category.js'
import { cloneDeep, get, isEqual } from 'lodash'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import Budget from '~/models/Budget.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { filterBagHasValues, getActiveFilters, getFiltersFromURL, saveToUrl } from '~/utils/FilterUtils.js'
import { useListFilters } from '~/composables/useListFilters.js'
import { IconSquareRoundedX } from '@tabler/icons-vue'

const dataStore = useDataStore()
const route = useRoute()

const transactionFiltersRef = ref(null)

let transactionRepository = new TransactionRepository()
const onCustomGetAll = async ({ page, pageSize }) => {
  if (filtersBackendList.value.length === 0) {
    return await transactionRepository.getAll({ page: page, pageSize })
  }
  let filters = [{ field: 'query', value: filtersBackendList.value.join(' ') }]
  return await transactionRepository.searchTransaction({
    page: page,
    pageSize: pageSize,
    filters: filters,
  })
}

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, listPagination, onAdd, onEdit, onDelete, onLoadMore, onRefresh } = useList({
  routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
  model: new Transaction(),
  getAll: onCustomGetAll,
})

const onShowFilters = () => {
  transactionFiltersRef.value.show()
}

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

let { filters, filtersBackendList, filtersDisplayList, activeFilters } = useListFilters({
  filterDefinitions: Object.values(TransactionFilterUtils.filters),
})

watch(filtersBackendList, (newValue, oldValue) => {
  if (isEqual(newValue, oldValue)) {
    return
  }
  onRefresh()
})

watch(filters, (newValue, oldValue) => {
  if (isEqual(newValue, oldValue)) {
    return
  }
  saveToUrl(activeFilters.value)
})

const onClearFilters = () => {
  filters.value = {}
}
// let filtersList = computed()

const { t } = useI18n()
const toolbar = useToolbar()
toolbar.init({
  title: t('transaction.title_list'),
  subtitle: computed(() => `${listTotalCount.value} ${t('items')}`),
})

onMounted(() => {
  let filterDefinitions = Object.values(TransactionFilterUtils.filters)
  filters.value = getFiltersFromURL(filterDefinitions)

  if (!filterBagHasValues(filters.value)) {
    filters.value = TransactionFilterUtils.getPredefinedFilters()
  }
})

animateSwipeList(list)
</script>
