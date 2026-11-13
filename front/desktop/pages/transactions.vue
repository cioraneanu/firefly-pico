<template>
  <d-page :title="$t('toolbar.transactions')" :description="`${listTotalCount} ${$t('items')}`">
    <template #actions>
      <d-button :icon="isEditing ? IconCheck : IconPencil" :aria-pressed="isEditing" :class="isEditing && 'bg-soft'" @click="isEditing = !isEditing">
        {{ $t(isEditing ? 'desktop.done_editing' : 'desktop.edit_inline') }}
      </d-button>
      <d-button :icon="IconSum" :aria-pressed="showSearchTotal" :class="showSearchTotal && 'bg-soft'" @click="onToggleSearchTotal">{{ $t('filters.compute_total') }}</d-button>
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_TRANSACTION_ID">{{ $t('new_transaction') }}</d-button>
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <d-input v-model="search" :icon="IconSearch" :placeholder="$t('description')" clearable class="w-70" />
      <div class="w-40">
        <d-enum-select v-model="transactionType" :options="Transaction.typesList" :icon="IconFilter" :placeholder="$t('transaction_type')" clearable />
      </div>
      <span class="flex-1" />
      <d-button :icon="IconRefresh" :loading="isRefreshing" @click="refresh">{{ $t('desktop.refresh') }}</d-button>
      <d-button :icon="IconFilter" @click="isFiltersOpen = true">
        {{ $t('desktop.filters') }}
        <d-badge v-if="activeFiltersCount" class="px-1.5 text-dim tabular-nums">{{ activeFiltersCount }}</d-badge>
      </d-button>
    </div>

    <d-filter-chips v-if="activeFilters.length" :filters="activeFilters" @remove="removeFilter" @clear="onClearFilters" />

    <div v-if="showSearchTotal" class="-mt-2 flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-fg/10">
      <span class="text-sm text-dim">{{ $t('filters.total_hint') }}</span>
      <b class="inline-flex items-center gap-1.5 font-semibold tabular-nums">
        <icon-loader-2 v-if="isComputingSearchTotal" :size="14" class="d-spin text-dim" />
        <app-count-up :value="searchTotalFormatted ?? '—'" />
      </b>
      <span class="flex-1" />
      <div class="w-36">
        <d-currency-select v-model="searchTotalCurrency" />
      </div>
    </div>

    <section class="overflow-x-auto rounded-xl bg-card ring-1 ring-fg/10">
      <div role="table" class="min-w-245">
        <template v-for="group in groups" :key="group.label">
          <div v-if="group.label" role="row" class="flex h-9 items-center justify-between border-y border-line bg-soft/55 px-4 text-xs font-medium text-dim first:border-t-0">
            <span>
              <b class="mr-2 font-medium text-fg">{{ group.label }}</b>
              {{ group.relative }}
            </span>
            <app-count-up :value="group.total" class="tabular-nums" />
          </div>
          <div class="divide-y divide-line">
            <d-transaction-row v-for="transaction in group.items" :key="transaction.id" :value="transaction" :editing="isEditing" @delete="onDelete" @saved="onReplace" />
          </div>
        </template>
      </div>
      <d-empty v-if="isEmpty && !isLoading" :icon="IconCoins">
        <d-button v-if="activeFilters.length" size="sm" @click="onClearFilters">{{ $t('filters.clear') }}</d-button>
      </d-empty>
      <div ref="sentinel" class="flex h-10 items-center justify-center text-dim">
        <icon-loader-2 v-if="isLoading" :size="18" class="d-spin" />
      </div>
    </section>

    <d-transaction-filters v-model="filters" v-model:open="isFiltersOpen" />
    <d-transaction-dialog v-if="isOpen" :key="`${id}-${route.query.transaction_id}-${route.query.assistant}`" @changed="onRefresh" />
  </d-page>
</template>

<script setup>
import { IconCheck, IconCoins, IconFilter, IconLoader2, IconPencil, IconPlus, IconRefresh, IconSearch, IconSum } from '@tabler/icons-vue'
import { useElementVisibility, watchDebounced } from '@vueuse/core'
import { omit } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Transaction from '~/core/models/Transaction'

const route = useRoute()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_TRANSACTION_LIST)
const {
  list,
  isEmpty,
  isLoading,
  isFinished,
  listTotalCount,
  onLoadMore,
  onRefresh,
  onDelete,
  onReplace,
  filters,
  activeFilters,
  activeFiltersCount,
  onClearFilters,
  showSearchTotal,
  searchTotalCurrency,
  isComputingSearchTotal,
  searchTotalFormatted,
  onToggleSearchTotal,
} = useTransactionList()

const isFiltersOpen = ref(false)
const isRefreshing = ref(false)
// Edit mode: rows turn into inputs that save on change
const isEditing = ref(false)
const search = ref('')
const sentinel = ref(null)
const isSentinelVisible = useElementVisibility(sentinel)

const transactionType = computed({
  get: () => filters.value.transactionType,
  set: (value) => (filters.value = { ...filters.value, transactionType: value }),
})

const removeFilter = (bagKey) => (filters.value = omit(filters.value, bagKey))

const refresh = async () => {
  isRefreshing.value = true
  await onRefresh()
  isRefreshing.value = false
}

watch(filters, (value) => (search.value = value.description ?? ''), { immediate: true })
watchDebounced(search, (value) => value !== (filters.value.description ?? '') && (filters.value = { ...filters.value, description: value }), { debounce: 400 })
watchEffect(() => isSentinelVisible.value && !isFinished.value && !isLoading.value && onLoadMore())

const groups = useTransactionGroups(list)
</script>
