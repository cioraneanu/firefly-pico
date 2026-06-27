<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <div class="flex-center-vertical gap-1">
          <div class="mr-10 cursor-pointer" @click.prevent.stop="onShowFilters">
            <app-icon :icon="TablerIconConstants.search" size="20" :stroke="1.9" />
          </div>

          <app-button-list-add @click="onAdd" />
        </div>
      </template>
    </app-top-toolbar>

    <div v-if="filtersDisplayList.length > 0" class="applied-filters-container">
      <div class="flex-center-vertical">
        <div class="title flex-1">{{ $t('filters.applied_filters') }}</div>
      </div>

      <div class="display-flex flex-wrap gap-1">
        <div v-for="appliedFilter in filtersDisplayList" :key="appliedFilter" class="tag-filter">
          <span class="ml-5">{{ appliedFilter }}</span>
        </div>
        <div class="cursor-pointer" style="z-index: 2" @click="onClearFilters">
          <icon-square-rounded-x :size="26" :stroke="1.5" />
        </div>
      </div>
    </div>

    <div class="main-content">
      <empty-list v-if="isEmpty && !isLoading" />

      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <van-list :class="listClass" :finished="isFinished" @load="onLoadMore">
          <template v-if="appStore.isDesktopLayout">
            <div class="transaction-desktop-list-wrapper">
              <div class="transaction-desktop-list">
                <transaction-list-item-desktop v-for="item in list" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
              </div>
            </div>
          </template>
          <template v-else>
            <transaction-list-item v-for="item in list" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
          </template>
        </van-list>
      </van-pull-refresh>
    </div>

    <transaction-filters ref="transactionFiltersRef" v-model="filters" />
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useList } from '~/composables/useList'
import Transaction from '~/models/Transaction'
import { useToolbar } from '~/composables/useToolbar'
import EmptyList from '~/components/general/empty-list.vue'
import { ref, computed, watch, onMounted } from 'vue'
import TransactionRepository from '~/repository/TransactionRepository'
import { isEqual } from 'lodash-es'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { IconSquareRoundedX } from '@tabler/icons-vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { filterBagHasValues, getFiltersFromURL, saveToUrl } from '~/utils/FilterUtils.js'
import { useListFilters } from '~/composables/useListFilters.js'

const appStore = useAppStore()

const listClass = computed(() => ({
  'p-1': true,
}))
const transactionFiltersRef = ref(null)

const transactionRepository = new TransactionRepository()
const onCustomGetAll = async ({ page, pageSize }) => {
  if (filtersBackendList.value.length === 0) {
    return await transactionRepository.getAll({ page: page, pageSize })
  }
  const filters = [{ field: 'query', value: filtersBackendList.value.join(' ') }]
  return await transactionRepository.searchTransaction({
    page: page,
    pageSize: pageSize,
    filters: filters,
  })
}

const { isLoading, isFinished, isRefreshing, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete, onLoadMore, onRefresh } = useList({
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

const { filters, filtersBackendList, filtersDisplayList, activeFilters } = useListFilters({
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

const { t } = useI18n()
const toolbar = useToolbar()
toolbar.init({
  title: t('transaction.title_list'),
  subtitle: computed(() => `${listTotalCount.value} ${t('items')}`),
})

onMounted(() => {
  const filterDefinitions = Object.values(TransactionFilterUtils.filters)
  filters.value = getFiltersFromURL(filterDefinitions)

  if (!filterBagHasValues(filters.value)) {
    filters.value = TransactionFilterUtils.getPredefinedFilters()
  }
})

animateSwipeList(list)
</script>

<style scoped>
.main-content {
  min-width: 0;
}

.transaction-desktop-list-wrapper {
  width: 100%;
  overflow-x: auto;
}

.transaction-desktop-list {
  min-width: 1100px;
  margin: 0px 20px;
  overflow: hidden;
  background: var(--van-background-2);
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.transaction-desktop-header {
  display: grid;
  grid-template-columns: 40px 110px minmax(180px, 1.8fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(120px, 1fr) 120px 80px;
  padding: 1rem 1.25rem;
  color: var(--van-text-color-2);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--van-background-3);
  border-bottom: 1px solid var(--van-border-color);
}

.text-right {
  text-align: right;
}
</style>
