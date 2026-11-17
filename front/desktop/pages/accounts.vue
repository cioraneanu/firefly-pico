<template>
  <d-page :title="$t('accounts')" :description="$t('desktop.accounts_description')">
    <template #actions>
      <d-refresh-button :action="accountStore.fetchAccounts" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_ACCOUNT_ID">{{ $t('account_page.title_add') }}</d-button>
    </template>

    <section class="overflow-hidden rounded-xl bg-card ring-1 ring-fg/10">
      <d-tabs v-model="activeType" :options="tabs" line />
      <div class="px-4 py-3">
        <d-input v-model="search" :icon="IconSearch" :placeholder="$t('search_placeholder')" clearable class="w-80" />
      </div>
      <table v-if="filtered.length" class="d-table border-t border-line">
        <thead>
          <tr>
            <th>{{ $t('account') }}</th>
            <th>{{ $t('account_page.account_type') }}</th>
            <th>{{ $t('account_page.account_role') }}</th>
            <th>{{ $t('account_page.account_group') }}</th>
            <th class="text-right">{{ $t('account_page.balance') }}</th>
            <th class="w-12" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in filtered" :key="account.id" class="cursor-pointer" @click="navigateTo(`${RouteConstants.ROUTE_ACCOUNT_ID}/${account.id}`)">
            <td>
              <span class="flex items-center gap-3">
                <d-tile :icon="Account.getIcon(account) ?? IconCreditCard" />
                <span class="truncate font-medium">{{ Account.getDisplayName(account) }}</span>
              </span>
            </td>
            <td>
              <d-badge variant="outline">{{ $t(get(account, 'attributes.type.t', '')) }}</d-badge>
            </td>
            <td class="text-dim">{{ get(account, 'attributes.account_role.t') ? $t(get(account, 'attributes.account_role.t')) : '—' }}</td>
            <td class="text-dim">{{ get(account, 'attributes.group') || '—' }}</td>
            <td class="text-right">
              <span :class="['whitespace-nowrap font-medium tabular-nums', Account.getBalance(account) < 0 && 'text-danger']">{{ Account.getBalanceWithCurrency(account) }}</span>
              <span v-if="Account.hasVirtualBalance(account)" class="block text-xs text-dim">{{ $t('account_page.available') }}: {{ Account.getAvailableBalanceWithCurrency(account) }}</span>
            </td>
            <td @click.stop>
              <d-menu :items="menu(account)" />
            </td>
          </tr>
        </tbody>
      </table>
      <d-empty v-else :icon="IconCreditCard" class="border-t border-line" />
    </section>

    <d-account-dialog v-if="isOpen" :key="id" />
    <d-balance-dialog v-if="balanceAccount" :account="balanceAccount" @close="balanceAccount = null" />
  </d-page>
</template>

<script setup>
import { IconAdjustments, IconCoins, IconCreditCard, IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'

const accountStore = useAccountStore()
const { t } = useI18n()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_ACCOUNT_LIST)
const { onDelete } = useList({ model: new Account(), onEvent: (event, account) => (accountStore.accountList = accountStore.accountList.filter((item) => item.id !== account.id)) })

const activeType = ref('all')
const balanceAccount = ref(null)
const types = [Account.types.asset, Account.types.expense, Account.types.liability, Account.types.revenue, Account.types.cash]
const tabs = computed(() => [{ value: 'all', label: t('transaction.type.all') }, ...types.map((type) => ({ value: type.fireflyCode, label: t(type.t) }))])

const byType = computed(() => accountStore.accountList.filter((account) => activeType.value === 'all' || Account.getType(account)?.fireflyCode === activeType.value))
const order = (account) => types.findIndex((type) => type.fireflyCode === Account.getType(account)?.fireflyCode)
const sorted = computed(() => [...byType.value].sort((a, b) => order(a) - order(b)))
const { search, filtered } = useSearch(sorted, (item) => Account.getDisplayName(item))

const menu = (account) => [
  { label: t('account_page.title_edit'), icon: IconPencil, action: () => navigateTo(`${RouteConstants.ROUTE_ACCOUNT_ID}/${account.id}`) },
  { label: t('account_page.adjust_balance'), icon: IconAdjustments, action: () => (balanceAccount.value = account) },
  { label: t('show_transactions'), icon: IconCoins, action: () => navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.account.toUrl([account])}`) },
  { label: t('delete'), icon: IconTrash, danger: true, action: () => onDelete(account) },
]
</script>
