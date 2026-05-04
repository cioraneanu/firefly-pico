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
      <div class="nav-section">
        <div class="section-label">{{ $t('main') }}</div>
        <app-left-sidebar-page label="Dashboard" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_DASHBOARD" />
        <app-left-sidebar-page label="Transactions" :icon="TablerIconConstants.transaction" :route="RouteConstants.ROUTE_TRANSACTION_LIST" />
      </div>

      <div class="nav-section">
        <div class="section-label">{{ $t('extra') }}</div>
        <app-left-sidebar-page :label="$t('accounts')" :icon="TablerIconConstants.account" :route="RouteConstants.ROUTE_ACCOUNT_LIST" />
        <app-left-sidebar-page :label="$t('templates')" :icon="TablerIconConstants.transactionTemplate" :route="RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST" />
        <app-left-sidebar-page :label="$t('budgets')" :icon="TablerIconConstants.budget" :route="RouteConstants.ROUTE_BUDGET_LIST" />
      </div>

      <div class="nav-section">
        <div class="section-label">{{ $t('classifications') }}</div>
        <app-left-sidebar-page :label="$t('tags')" :icon="TablerIconConstants.tag" :route="RouteConstants.ROUTE_TAG_LIST" />
        <app-left-sidebar-page :label="$t('categories')" :icon="TablerIconConstants.category" :route="RouteConstants.ROUTE_CATEGORY_LIST" />
      </div>

      <div class="nav-section mt-auto">
        <div class="flex-center-vertical gap-1">
          <profile-picker-desktop-button class="flex-1" />
          <div class="profile-picker-dashboard-button">
            <app-icon @click="onChangeTheme" :size="20" :stroke-width="2.0" :icon="profileStore.darkTheme ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </div>
        </div>

        <div class="section-label mt-3">{{ $t('toolbar.settings') }}</div>
        <app-left-sidebar-page :label="$t('toolbar.settings')" :icon="TablerIconConstants.settings" :route="RouteConstants.ROUTE_SETTINGS" :dot="appStore.isNewVersionAvailable" />
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore.js'
import { useProfileStore } from '~/stores/profileStore.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'

const dataStore = useDataStore()
const profileStore = useProfileStore()
const appStore = useAppStore()
const route = useRoute()

const onChangeTheme = () => {
  profileStore.darkTheme = !profileStore.darkTheme
  profileStore.writeProfile()
}
</script>

<style scoped></style>
