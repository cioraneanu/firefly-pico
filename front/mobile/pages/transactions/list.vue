<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <div class="flex items-center gap-1">
          <div class="mr-2.5 cursor-pointer" @click.prevent.stop="onShowFilters">
            <app-icon :icon="TablerIconConstants.search" size="20" :stroke="1.9" />
          </div>

          <app-button-list-add @click="onAdd" />
        </div>
      </template>
    </app-top-toolbar>

    <div v-if="filtersDisplayList.length > 0" class="applied-filters-container">
      <div class="flex items-center">
        <div class="title flex-1">{{ $t('filters.applied_filters') }}</div>
        <van-button size="small" class="search-total-toggle" @click="onToggleSearchTotal">
          <icon-settings :size="14" :stroke="1.9" />
        </van-button>
      </div>

      <div class="flex flex-wrap gap-1">
        <div v-for="appliedFilter in filtersDisplayList" :key="appliedFilter" class="tag-filter">
          <span class="ml-1.25">{{ appliedFilter }}</span>
        </div>
        <div class="cursor-pointer" style="z-index: 2" @click="onClearFilters">
          <icon-square-rounded-x :size="26" :stroke="1.5" />
        </div>
      </div>

      <div v-if="showSearchTotal" class="search-total-row">
        <van-button size="mini" class="search-total-compute-button" :loading="isComputingSearchTotal" @click="onComputeSearchTotal">
          {{ $t('filters.compute_total') }}
        </van-button>
        <div class="flex-1" />
        <div class="search-total-amount">{{ searchTotalFormatted }}</div>
        <currency-dropdown v-model="searchTotalCurrency" />
      </div>
    </div>

    <div class="main-content">
      <empty-list v-if="isEmpty && !isLoading" />

      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <van-list :class="listClass" :finished="isFinished" :scroller="listScroller" @load="onLoadMore">
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
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { useToolbar } from '~/mobile/composables/useToolbar'
import EmptyList from '~/mobile/components/general/empty-list.vue'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'
import { IconSquareRoundedX, IconSettings } from '@tabler/icons-vue'

const appStore = useAppStore()
const { t } = useI18n()

const listScroller = computed(() => (appStore.isDesktopLayout ? window : undefined))
const listClass = { 'p-1': true }

const {
  isLoading,
  isFinished,
  isRefreshing,
  listTotalCount,
  list,
  isEmpty,
  onAdd,
  onEdit,
  onDelete,
  onLoadMore,
  onRefresh,
  filters,
  filtersDisplayList,
  onClearFilters,
  showSearchTotal,
  searchTotalCurrency,
  isComputingSearchTotal,
  searchTotalFormatted,
  onToggleSearchTotal,
  onComputeSearchTotal,
} = useTransactionList()

const formClass = computed(() => ({ 'app-form': true, empty: isEmpty.value }))

const toolbar = useToolbar()
toolbar.init({
  title: t('transaction.title_list'),
  subtitle: computed(() => `${listTotalCount.value} ${t('items')}`),
})

animateSwipeList(list)
</script>

<style scoped>
.main-content {
  min-width: 0;
}

.transaction-desktop-list-wrapper {
  width: 100%;
  container: transaction-list / inline-size;
}

.transaction-desktop-list {
  margin: 0px 20px;
  overflow: hidden;
  background: var(--van-background-2);
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.text-right {
  text-align: right;
}
</style>
