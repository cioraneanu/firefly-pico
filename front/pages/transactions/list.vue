<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <div>
          <van-button @click="onShowFilters" size="small" class="mr-10 no-border">
            <template #icon>
              <icon-adjustments-alt size="20" :stroke-width="1.9" />
            </template>
          </van-button>

          <app-button-list-add @click="onAdd" />
        </div>
      </template>
    </app-top-toolbar>

    <div class="applied-filters-container" v-if="filtersDisplayList.length > 0">
      <div class="flex-center-vertical">
        <div class="title flex-1">Applied filters</div>
        <van-button @click="onClearFilters" size="small" class=""> Clear</van-button>
      </div>

      <div class="display-flex flex-wrap gap-1">
        <div v-for="appliedFilter in filtersDisplayList" class="tag-filter">
          <icon-filter size="14" :stroke-width="1.9" />
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
import { IconAdjustmentsAlt, IconFilter } from '@tabler/icons-vue'
import { ref } from 'vue'
import TransactionRepository from '~/repository/TransactionRepository'
import Tag from '~/models/Tag.js'
import Account from '~/models/Account.js'
import Category from '~/models/Category.js'
import { get, isEqual } from 'lodash'
import anime from 'animejs'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import Budget from '~/models/Budget.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'

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

const { title, isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, listPagination, onAdd, onEdit, onDelete, onLoadMore, onRefresh } = useList({
  title: 'Transactions list',
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

let filtersDictionary = computed(() => {
  let result = TransactionFilterUtils.getActiveFilters(filters.value)
  console.log('filters', { filters: filters.value, result })
  return result
  // return [
  //   {
  //     display: `Description: ${_filter.description}`,
  //     filter: `description_contains:"${_filter.description}"`,
  //     active: !isStringEmpty(_filter.description),
  //   },
  //   {
  //     display: `Type: ${get(_filter, 'transactionType.name')}`,
  //     filter: `type:"${get(_filter, 'transactionType.fireflyCode')}"`,
  //     active: !!_filter.transactionType,
  //   },
  //   {
  //     display: `Tag: ${Tag.getDisplayNameEllipsized(_filter.tag)}`,
  //     filter: `tag_is:"${Tag.getDisplayNameEllipsized(_filter.tag)}"`,
  //     active: !!_filter.tag,
  //   },
  //   {
  //     display: `- Tag: ${Tag.getDisplayNameEllipsized(_filter.excludedTag)}`,
  //     filter: `-tag_is:"${Tag.getDisplayNameEllipsized(_filter.excludedTag)}"`,
  //     active: !!_filter.excludedTag,
  //   },
  //   {
  //     display: `No tags`,
  //     filter: `has_any_tag:false"`,
  //     active: !!_filter.withoutTag,
  //   },
  //   {
  //     display: `Category: ${Category.getDisplayName(_filter.category)}`,
  //     filter: `category_is:"${Category.getDisplayName(_filter.category)}"`,
  //     active: !!_filter.category,
  //   },
  //   {
  //     display: `- Category: ${Category.getDisplayName(_filter.excludedCategory)}`,
  //     filter: `-category_is:"${Category.getDisplayName(_filter.excludedCategory)}"`,
  //     active: !!_filter.excludedCategory,
  //   },
  //   {
  //     display: `No category`,
  //     filter: `has_any_category:false"`,
  //     active: !!_filter.withoutCategory,
  //   },
  //   {
  //     display: `Budget: ${Budget.getDisplayName(_filter.budget)}`,
  //     filter: `budget_is:"${Budget.getDisplayName(_filter.budget)}"`,
  //     active: !!_filter.budget,
  //   },
  //   {
  //     display: `No budget`,
  //     filter: `has_any_budget:false"`,
  //     active: !!_filter.withoutBudget,
  //   },
  //   {
  //     display: `Account: ${Account.getDisplayName(_filter.account)}`,
  //     filter: `account_is:"${Account.getDisplayName(_filter.account)}"`,
  //     active: !!_filter.account,
  //   },
  //   {
  //     display: `- Account: ${Account.getDisplayName(_filter.excludedAccount)}`,
  //     filter: `-account_is:"${Account.getDisplayName(_filter.excludedAccount)}"`,
  //     active: !!_filter.excludedAccount,
  //   },
  //   {
  //     display: `Amount > ${_filter.amountStart}`,
  //     filter: `more:"${_filter.amountStart}"`,
  //     active: !!_filter.amountStart,
  //   },
  //   {
  //     display: `Amount < ${_filter.amountEnd}`,
  //     filter: `less:"${_filter.amountEnd}"`,
  //     active: !!_filter.amountEnd,
  //   },
  //   {
  //     display: `Date > ${DateUtils.dateToUI(_filter.dateStart)}`,
  //     filter: `date_after:"${DateUtils.dateToString(_filter.dateStart)}"`,
  //     active: !!_filter.dateStart,
  //   },
  //   {
  //     display: `Date < ${DateUtils.dateToUI(_filter.dateEnd)}`,
  //     filter: `date_before:"${DateUtils.dateToString(_filter.dateEnd)}"`,
  //     active: !!_filter.dateEnd,
  //   },
  // ].map((item) => {
  //   item.filter = item.filter.replace(/(\w+):"([^"]+)"/g, (match, key, content) => `${key}:"${encodeURIComponent(content)}"`)
  //   return item
  // })
})

let filtersDisplayList = computed(() => {
  return filtersDictionary.value.map((item) => item.display)
})

let filtersBackendList = computed(() => {
  return filtersDictionary.value.map((item) => item.filter)
})

watch(filtersBackendList, (newValue, oldValue) => {
  if (isEqual(newValue, oldValue)) {
    return
  }
  onRefresh()
})

const onClearFilters = () => {
  filters.value = {}
}
// let filtersList = computed()

const toolbar = useToolbar()
toolbar.init({
  title: 'Transactions list',
  // subtitle: 'bla'
  subtitle: computed(() => `${listTotalCount.value} Items`),
  // backRoute: RouteConstants.ROUTE_EXTRAS,
})

onMounted(() => {
  filters.value = TransactionFilterUtils.getFiltersFromURL()
})

animateSwipeList(list)
</script>
