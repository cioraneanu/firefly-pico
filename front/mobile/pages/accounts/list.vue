<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <template v-if="list.length > 0">
          <app-list-search v-model="search" :placeholder="$t('account_page.search')" />

          <div class="mx-tabs" role="tablist" :aria-label="$t('account_page.account_type')">
            <button
              v-for="tab in accountTypeTabs"
              :key="tab.value"
              type="button"
              role="tab"
              :class="{ on: tab.value === filterAccountType }"
              :aria-selected="tab.value === filterAccountType"
              @click="filterAccountType = tab.value"
            >
              <span>{{ tab.label }}</span>
              <span class="n">{{ tab.count }}</span>
            </button>
          </div>
        </template>

        <div v-if="filteredList.length > 0" class="mx-list">
          <account-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="onClearFilters">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.account" :hint="$t('account_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('account_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useAccountStore } from '~/core/stores/accountStore'
import { useList } from '~/core/composables/useList'
import Account from '~/core/models/Account'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const { t } = useI18n()
const accountStore = useAccountStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    accountStore.accountList = accountStore.accountList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_ACCOUNT_LIST,
  routeForm: RouteConstants.ROUTE_ACCOUNT_ID,
  model: new Account(),
  onEvent: onEvent,
})

const search = ref('')

const accountTypesSorted = [Account.types.asset, Account.types.expense, Account.types.liability, Account.types.revenue, Account.types.cash]
const getTypeCode = (account) => get(Account.getType(account), 'fireflyCode')

const filterAccountType = ref('all')
const accountTypeTabs = computed(() => [
  { label: t('transaction.type.all'), value: 'all', count: list.value.length },
  ...accountTypesSorted.map((type) => ({ label: t(type.t), value: type.fireflyCode, count: list.value.filter((item) => getTypeCode(item) === type.fireflyCode).length })),
])

const getTypeSortIndex = (account) => {
  const index = accountTypesSorted.findIndex((type) => type.fireflyCode === getTypeCode(account))
  return index === -1 ? accountTypesSorted.length : index
}

const filteredList = computed(() => {
  let result = list.value
  if (filterAccountType.value !== 'all') {
    result = result.filter((item) => getTypeCode(item) === filterAccountType.value)
  }
  if (search.value.length > 0) {
    result = result.filter((item) => LanguageUtils.includesSearch(Account.getDisplayName(item), search.value))
  }
  return [...result].sort((a, b) => getTypeSortIndex(a) - getTypeSortIndex(b))
})

const onClearFilters = () => {
  search.value = ''
  filterAccountType.value = 'all'
}

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true
  await accountStore.fetchAccounts()
  isLoading.value = false
  isRefreshing.value = false
  onLoadMore()
}

// The whole list comes from the store, so one load finishes it
const onLoadMore = () => {
  list.value = accountStore.accountList
  isFinished.value = true
}

useToolbar().init({
  title: t('accounts'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
