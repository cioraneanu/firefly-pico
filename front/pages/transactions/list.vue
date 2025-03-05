<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <div>
          <van-button @click="onShowFilters" size="small" class="mr-10 no-border">
            <template #icon>
              <app-icon :icon="TablerIconConstants.search" size="20" :stroke="1.9" />
            </template>
          </van-button>

          <app-button-list-add @click="onAdd" />
        </div>
      </template>
    </app-top-toolbar>

    <div class="applied-filters-container" v-if="filtersDisplayList.length > 0">
      <div class="flex-center-vertical">
        <div class="title flex-1">{{ $t('filters.applied_filters') }}</div>
        <van-button @click="onClearFilters" size="small" class="">{{ $t('filters.clear') }}</van-button>
      </div>

      <div class="display-flex flex-wrap gap-1">
        <div v-for="appliedFilter in filtersDisplayList" class="tag-filter">
          <app-icon :icon="TablerIconConstants.filter" size="14" :stroke="1.9" />
          <span class="ml-5">{{ appliedFilter }}</span>
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
// import { IconAdjustmentsAlt, IconFilter } from '@tabler/icons-vue'
import { ref } from 'vue'
import TransactionRepository from '~/repository/TransactionRepository'
import Tag from '~/models/Tag.js'
import Account from '~/models/Account.js'
import Category from '~/models/Category.js'
import { cloneDeep, get, isEqual } from 'lodash'
import anime from 'animejs'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import Budget from '~/models/Budget.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { filterBagHasValues, getActiveFilters, getFiltersFromURL, saveToUrl } from '~/utils/FilterUtils.js'

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

let filters = ref({})

let activeFilters = computed(() => {
  let filterDefinitions = Object.values(TransactionFilterUtils.filters)
  return getActiveFilters(filterDefinitions,filters.value)
})

let filtersDisplayList = computed(() => {
  return activeFilters.value.map((item) => item.display)
})

let filtersBackendList = computed(() => {
  return activeFilters.value.map((item) => item.filter)
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
  console.log('saveToUrl', activeFilters.value)
  // saveToUrl(activeFilters.value)
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
  console.log('filterValues1', filters.value)


  if (!filterBagHasValues(filters.value)) {
    console.log('filterValues2')
    filters.value = TransactionFilterUtils.getPredefinedFilters()
  }
})

animateSwipeList(list)
</script>
