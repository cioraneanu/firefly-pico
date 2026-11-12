<template>
  <d-page :title="$t('toolbar.transactions')" :description="`${listTotalCount} ${$t('items')}`">
    <template #actions>
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_TRANSACTION_ID">{{ $t('new_transaction') }}</d-button>
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <d-input v-model="search" :icon="IconSearch" :placeholder="$t('description')" clearable class="w-70" />
      <button
        ref="typeTrigger"
        type="button"
        :aria-expanded="isTypeOpen"
        :class="[
          'inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed bg-bg px-2.5 text-[13.5px] font-medium transition-colors hover:bg-soft',
          isTypeOpen ? 'border-fg/55' : 'border-fg/30',
        ]"
        @click="isTypeOpen = !isTypeOpen"
      >
        <icon-filter :size="15" class="text-dim" />
        {{ $t('transaction_type') }}
        <template v-if="transactionType">
          <span class="mx-0.5 h-4 w-px bg-line" />
          <span class="inline-flex h-5 items-center rounded-[5px] bg-soft px-1.5 text-xs font-medium">{{ $t(transactionType.t) }}</span>
        </template>
      </button>
      <d-popover v-model:open="isTypeOpen" :anchor="typeTrigger" width="14.5rem">
        <button
          v-for="option in typeOptions"
          :key="option.value.code"
          type="button"
          role="option"
          :aria-selected="transactionType?.code === option.value.code"
          class="flex h-8 w-full cursor-default items-center gap-2 rounded-md px-2 text-left text-[13.5px] hover:bg-soft"
          @click="pickType(option.value)"
        >
          <span
            :class="[
              'grid size-4 shrink-0 place-items-center rounded-[4px]',
              transactionType?.code === option.value.code ? 'bg-primary text-on-primary' : 'text-transparent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--d-fg)_35%,transparent)]',
            ]"
          >
            <icon-check :size="12" :stroke-width="3" />
          </span>
          <component :is="option.icon" :size="15" :class="typeColors[option.value.code]" />
          <span class="flex-1 truncate">{{ option.label }}</span>
        </button>
        <template v-if="transactionType">
          <div class="-mx-1 my-1 h-px bg-line" />
          <button type="button" class="flex h-8 w-full cursor-default items-center justify-center rounded-md px-2 text-[13.5px] hover:bg-soft" @click="pickType(null)">
            {{ $t('filters.clear') }}
          </button>
        </template>
      </d-popover>
      <span class="flex-1" />
      <d-button :icon="IconRefresh" :loading="isRefreshing" @click="refresh">{{ $t('desktop.refresh') }}</d-button>
      <d-button :icon="IconSum" :aria-pressed="showSearchTotal" :class="showSearchTotal && 'bg-soft'" @click="onToggleSearchTotal">{{ $t('filters.total') }}</d-button>
      <d-button :icon="IconFilter" @click="isFiltersOpen = true">
        {{ $t('desktop.filters') }}
        <d-badge v-if="activeFiltersCount" class="px-1.5 text-dim tabular-nums">{{ activeFiltersCount }}</d-badge>
      </d-button>
    </div>

    <d-filter-chips v-if="activeFilters.length" :filters="activeFilters" @remove="removeFilter" @clear="onClearFilters" />

    <div v-if="showSearchTotal" class="-mt-2 flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-fg/10">
      <d-button size="sm" :loading="isComputingSearchTotal" @click="onComputeSearchTotal">{{ $t('filters.compute_total') }}</d-button>
      <b class="font-semibold tabular-nums">{{ searchTotalFormatted ?? '—' }}</b>
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
            <span class="tabular-nums">{{ group.total }}</span>
          </div>
          <div class="divide-y divide-line">
            <d-transaction-row v-for="transaction in group.items" :key="transaction.id" :value="transaction" @delete="onDelete" />
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
    <d-transaction-dialog v-if="isOpen" :key="`${id}-${route.query.transaction_id}`" @changed="onRefresh" />
  </d-page>
</template>

<script setup>
import { IconCheck, IconCoins, IconFilter, IconLoader2, IconPlus, IconRefresh, IconSearch, IconSum } from '@tabler/icons-vue'
import { useElementVisibility, watchDebounced } from '@vueuse/core'
import { omit } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'

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
  filters,
  activeFilters,
  activeFiltersCount,
  onClearFilters,
  showSearchTotal,
  searchTotalCurrency,
  isComputingSearchTotal,
  searchTotalFormatted,
  onToggleSearchTotal,
  onComputeSearchTotal,
} = useTransactionList()

const isFiltersOpen = ref(false)
const isTypeOpen = ref(false)
const isRefreshing = ref(false)
const typeTrigger = ref(null)
const typeOptions = useTransactionTypeOptions()
const typeColors = { expense: 'text-tx-expense', income: 'text-income', transfer: 'text-transfer' }
const search = ref('')
const sentinel = ref(null)
const isSentinelVisible = useElementVisibility(sentinel)

const transactionType = computed({
  get: () => filters.value.transactionType,
  set: (value) => (filters.value = { ...filters.value, transactionType: value }),
})

const removeFilter = (bagKey) => (filters.value = omit(filters.value, bagKey))

const pickType = (type) => {
  transactionType.value = transactionType.value?.code === type?.code ? null : type
  isTypeOpen.value = false
}

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
