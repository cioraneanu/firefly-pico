<template>
  <div class="app-left-sidebar">
    <div class="sidebar-header">
      <div class="add-btn-wrapper">
        <nuxt-link :to="RouteConstants.ROUTE_TRANSACTION_ID" class="p-0">
          <button class="add-transaction-btn-desktop">
            <app-icon :icon="TablerIconConstants.dashboardTotalIncomes" :size="20" />
            <span class="">{{ $t('new_transaction') }}</span>
          </button>
        </nuxt-link>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div v-for="section in sidebarSections" :key="section.key" class="nav-section">
        <button type="button" class="section-label section-label-toggle" @click="toggleSection(section.key)">
          <span>{{ section.label }}</span>
          <component :is="isSectionExpanded(section.key) ? IconChevronUp : IconChevronDown" :size="14" />
        </button>

        <template v-if="isSectionExpanded(section.key)">
          <app-left-sidebar-page v-for="page in section.pages" :key="page.key" :label="page.label" :icon="page.icon" :route="page.route" />
        </template>
      </div>
    </nav>

    <div class="nav-section mt-auto">
      <div class="flex-center-vertical gap-1">
        <profile-picker-desktop-button class="flex-1" />
        <div class="profile-picker-dashboard-button">
          <app-icon :size="20" :stroke-width="2.0" :icon="profileStore.darkTheme ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" @click="onChangeTheme" />
        </div>
      </div>

      <div class="section-label mt-3">{{ $t('toolbar.settings') }}</div>
      <app-left-sidebar-page v-for="page in settingsPages" :key="page.key" :label="page.label" :icon="page.icon" :route="page.route" :dot="page.dot" />
    </div>
  </div>
</template>

<script setup>
import { useProfileStore } from '~/stores/profileStore.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { IconChevronUp, IconChevronDown } from '@tabler/icons-vue'
import { useLocalStorage } from '@vueuse/core'

const profileStore = useProfileStore()
const appStore = useAppStore()
const { t } = useI18n()

const expandedSections = useLocalStorage('leftSidebarExpandedSections', {
  main: true,
  classifications: true,
  secondary: true,
  extra: false,
})

const sidebarSections = computed(() =>
  [
    {
      key: 'main',
      label: t('main'),
      pages: [
        { key: 'dashboard', label: 'Dashboard', icon: TablerIconConstants.dashboard, route: RouteConstants.ROUTE_DASHBOARD },
        { key: 'analytics', label: t('analytics.title'), icon: TablerIconConstants.analytics, route: RouteConstants.ROUTE_ANALYTICS },
        { key: 'transactions', label: 'Transactions', icon: TablerIconConstants.transaction, route: RouteConstants.ROUTE_TRANSACTION_LIST },
        { key: 'accounts', label: t('accounts'), icon: TablerIconConstants.account, route: RouteConstants.ROUTE_ACCOUNT_LIST },
      ],
    },
    {
      key: 'classifications',
      label: t('classifications'),
      pages: [
        { key: 'tags', label: t('tags'), icon: TablerIconConstants.tag, route: RouteConstants.ROUTE_TAG_LIST, visible: profileStore.tagsEnabled },
        { key: 'categories', label: t('categories'), icon: TablerIconConstants.category, route: RouteConstants.ROUTE_CATEGORY_LIST, visible: profileStore.categoriesEnabled },
      ],
    },
    {
      key: 'secondary',
      label: t('secondary'),
      pages: [
        { key: 'templates', label: t('templates'), icon: TablerIconConstants.transactionTemplate, route: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST },
        { key: 'budgets', label: t('budgets'), icon: TablerIconConstants.budget, route: RouteConstants.ROUTE_BUDGET_LIST, visible: profileStore.budgetsEnabled },
        { key: 'piggy-banks', label: t('piggy_banks'), icon: TablerIconConstants.piggyBank, route: RouteConstants.ROUTE_PIGGY_BANK_LIST, visible: profileStore.piggyBanksEnabled },
        {
          key: 'recurring-transactions',
          label: t('recurring_transactions'),
          icon: TablerIconConstants.recurringTransaction,
          route: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
          visible: profileStore.recurringTransactionsEnabled,
        },
      ],
    },
    {
      key: 'extra',
      label: t('extra'),
      pages: [
        { key: 'exchange-rates', label: t('exchange_rates'), icon: TablerIconConstants.exchangeRates, route: RouteConstants.ROUTE_EXCHANGE_RATES },
        { key: 'currencies', label: t('currencies'), icon: TablerIconConstants.currency, route: RouteConstants.ROUTE_CURRENCY_LIST },
      ],
    },
  ]
    .map((section) => ({
      ...section,
      pages: section.pages.filter((page) => page.visible !== false),
    }))
    .filter((section) => section.pages.length > 0),
)

const settingsPages = computed(() => [{ key: 'settings', label: t('toolbar.settings'), icon: TablerIconConstants.settings, route: RouteConstants.ROUTE_SETTINGS, dot: appStore.isNewVersionAvailable }])

const isSectionExpanded = (key) => expandedSections.value[key] === true

const toggleSection = (key) => {
  expandedSections.value[key] = !isSectionExpanded(key)
}

const onChangeTheme = () => {
  profileStore.darkTheme = !profileStore.darkTheme
  profileStore.writeProfile()
}
</script>
