<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-model="search" :placeholder="$t('transaction_list_page.search')">
          <template #right>
            <button type="button" class="mx-ib out mx-ib40 mx-fbtn" :aria-label="$t('filters.transaction_filters')" @click="onShowFilters">
              <app-icon :icon="IconAdjustmentsHorizontal" :size="18" :stroke="2" />
              <span v-if="activeFiltersCount > 0" class="mx-fbtn__n">{{ activeFiltersCount }}</span>
            </button>
          </template>
        </app-list-search>

        <div v-if="activeFilters.length > 0" class="mxe-fchips justify-start items-center">
          <span v-for="activeFilter in activeFilters" :key="activeFilter.bagKey" class="mx-chip fill">
            <span>{{ activeFilter.display }}</span>
            <button type="button" :aria-label="$t('clear')" @click="onRemoveFilter(activeFilter.bagKey)">
              <app-icon :icon="IconX" :size="12" :stroke="2" />
            </button>
          </span>
          <button type="button" class="mx-btn xs ghost" @click="onClearFilters">{{ $t('general.clear_filters') }}</button>
          <button type="button" class="mx-ib sm ml-auto" :class="{ out: showSearchTotal }" :aria-label="$t('filters.total')" @click="onToggleSearchTotal">
            <app-icon :icon="IconSum" :size="16" :stroke="2" />
          </button>
        </div>

        <div v-if="activeFilters.length > 0 && showSearchTotal" class="mx-list flex items-center gap-2 px-3 py-2">
          <button type="button" class="mx-btn out sm" :disabled="isComputingSearchTotal" @click="onComputeSearchTotal">
            <span v-if="isComputingSearchTotal" class="mx-spin" />
            <span>{{ $t('filters.compute_total') }}</span>
          </button>
          <div class="flex-1" />
          <b class="mx-tnum mx-money text-14">{{ searchTotalFormatted }}</b>
          <currency-dropdown v-model="searchTotalCurrency" />
        </div>

        <div v-if="list.length > 0" class="mx-list">
          <template v-for="group in groups" :key="group.label">
            <div v-if="group.label" class="mx-grp">
              <span
                ><b>{{ group.dayOfWeek }}</b> · {{ group.label }}</span
              >
              <span class="mx-tnum mx-money">{{ group.total }}</span>
            </div>
            <transaction-list-item v-for="item in group.items" :key="item.id" :value="item" clonable @on-edit="onEdit" @on-delete="onDelete" />
          </template>
        </div>

        <div v-else-if="!isFinished" class="mx-list mx-tx-sk" aria-busy="true">
          <div v-for="width in [58, 44, 66, 38, 52, 47]" :key="width" class="mx-skrow">
            <span class="mx-sk" style="width: 36px; height: 36px; border-radius: 10px" />
            <span class="m">
              <span class="mx-sk" :style="{ width: `${width}%`, height: '12px' }" />
              <span class="mx-sk" :style="{ width: `${width - 14}%`, height: '10px' }" />
            </span>
            <span class="mx-sk" style="width: 56px; height: 12px" />
          </div>
        </div>

        <empty-list v-else-if="activeFiltersCount > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="onClearFilters">
              <app-icon :icon="IconAdjustmentsOff" :size="16" :stroke="2" />
              <span>{{ $t('general.clear_filters') }}</span>
            </button>
          </template>
        </empty-list>

        <empty-list v-else :icon="TablerIconConstants.transaction" :hint="$t('transaction_list_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">
              <app-icon :icon="IconPlus" :size="16" :stroke="2" />
              <span>{{ $t('transaction.title_add_transaction') }}</span>
            </button>
          </template>
        </empty-list>

        <p v-if="list.length > 0" class="mx-foot">{{ $t('transaction_list_page.showing', { count: list.length, total: listTotalCount }) }}</p>
      </app-list>
    </main>

    <transaction-filters ref="transactionFiltersRef" v-model="filters" />
  </div>
</template>

<script setup>
import { watchDebounced } from '@vueuse/core'
import { IconAdjustmentsHorizontal, IconAdjustmentsOff, IconPlus, IconSum, IconX } from '@tabler/icons-vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const { t } = useI18n()

const {
  isLoading,
  isFinished,
  isRefreshing,
  listTotalCount,
  list,
  onAdd,
  onEdit,
  onDelete,
  onLoadMore,
  onRefresh,
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

const onRemoveFilter = (bagKey) => (filters.value = { ...filters.value, [bagKey]: null })

// The search box is the description filter
const search = ref('')
watch(
  () => filters.value.description,
  (value) => (search.value = value ?? ''),
)
watchDebounced(search, (value) => (filters.value.description ?? '') !== value && (filters.value = { ...filters.value, description: value || null }), { debounce: 500 })

// Rows grouped by day, each with its expenses total (same as the desktop list)
const groups = useTransactionGroups(list)

const transactionFiltersRef = useTemplateRef('transactionFiltersRef')
const onShowFilters = () => transactionFiltersRef.value.show()

const toolbar = useToolbar()
toolbar.init({
  title: t('transaction.title_list'),
  subtitle: computed(() => `${listTotalCount.value} ${t('items')}`),
})

animateSwipeList(list)
</script>
