<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <empty-list v-if="isEmpty" />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <app-list-search v-if="isSearchVisible && list.length > 0" v-model="search">
          <template #right>
            <van-popover v-model:show="showFilterPopover" placement="bottom-end" overlay :overlay-style="{ background: 'transparent' }">
              <div class="display-flex flex-column gap-1 p-10">
                <div class="text-size-12 font-weight-600 text-muted">{{ $t('account_page.account_type') }}</div>
                <app-tabs v-model="filterAccountType" :items="accountTypeTabs" />
              </div>

              <template #reference>
                <button type="button" class="app-button-icon">
                  <app-icon :icon="TablerIconConstants.settings" :size="18" />
                </button>
              </template>
            </van-popover>
          </template>
        </app-list-search>

        <account-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useAccountStore } from '~/stores/accountStore'
import { useList } from '~/composables/useList'
import Account from '~/models/Account'
import { useToolbar } from '~/composables/useToolbar'
import { ref } from 'vue'
import { get } from 'lodash-es'

import TablerIconConstants from '~/constants/TablerIconConstants'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/utils/AnimationUtils.js'

const { t } = useI18n()
const accountStore = useAccountStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    accountStore.accountList = accountStore.accountList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  title: 'Accounts list',
  routeList: RouteConstants.ROUTE_ACCOUNT_LIST,
  routeForm: RouteConstants.ROUTE_ACCOUNT_ID,
  model: new Account(),
  onEvent: onEvent,
})

const search = ref('')
const isSearchVisible = ref(true)

const accountTypesSorted = [Account.types.asset, Account.types.expense, Account.types.liability, Account.types.revenue, Account.types.cash]

const showFilterPopover = ref(false)
const filterAccountType = ref('all')
const accountTypeTabs = computed(() => [
  { label: t('transaction.type.all'), value: 'all' },
  ...accountTypesSorted.map((type) => ({ label: t(type.t), value: type.fireflyCode })),
])

const getTypeSortIndex = (account) => {
  const index = accountTypesSorted.findIndex((type) => type.fireflyCode === get(Account.getType(account), 'fireflyCode'))
  return index === -1 ? accountTypesSorted.length : index
}

const filteredList = computed(() => {
  let result = list.value
  if (filterAccountType.value !== 'all') {
    result = result.filter((item) => get(Account.getType(item), 'fireflyCode') === filterAccountType.value)
  }
  if (search.value.length > 0) {
    result = result.filter((item) => Account.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1)
  }
  return [...result].sort((a, b) => getTypeSortIndex(a) - getTypeSortIndex(b))
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const accountStore = useAccountStore()
  await accountStore.fetchAccounts()

  isLoading.value = false
  isRefreshing.value = false
  onLoadMore()
}

const onLoadMore = () => {
  const accountStore = useAccountStore()
  list.value = accountStore.accountList
  // The whole list comes from the store => stop van-list from triggering more loads on scroll
  isFinished.value = true
}

// const onClickBack = async () => {
//   await navigateTo(RouteConstants.ROUTE_EXTRAS)
// }

const toolbar = useToolbar()
toolbar.init({
  title: t('accounts'),
  titleIcon: TablerIconConstants.account,
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)

</script>
