<template>
  <div class="app-left-sidebar">
    <div class="sidebar-header">
      <div class="add-btn-wrapper">
        <nuxt-link :to="RouteConstants.ROUTE_TRANSACTION_ID" class="p-0">
          <button class="add-transaction-btn-desktop">
            <app-icon :icon="TablerIconConstants.dashboardTotalIncomes" :size="20" />
            <span>New Transaction</span>
          </button>
        </nuxt-link>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="section-label">Main</div>
        <app-left-sidebar-page label="Dashboard" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_DASHBOARD" />
        <app-left-sidebar-page label="Transactions" :icon="TablerIconConstants.transaction" :route="RouteConstants.ROUTE_TRANSACTION_LIST" />
      </div>

      <div class="nav-section">
        <div class="section-label">Extras</div>
        <app-left-sidebar-page label="Accounts" :icon="TablerIconConstants.account" :route="RouteConstants.ROUTE_ACCOUNT_LIST" />
        <app-left-sidebar-page label="Templates" :icon="TablerIconConstants.transactionTemplate" :route="RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST" />
        <app-left-sidebar-page label="Budgets" :icon="TablerIconConstants.budget" :route="RouteConstants.ROUTE_BUDGET_LIST" />
      </div>

      <div class="nav-section">
        <div class="section-label">Classifications</div>
        <app-left-sidebar-page label="Tags" :icon="TablerIconConstants.tag" :route="RouteConstants.ROUTE_TAG_LIST" />
        <app-left-sidebar-page label="Categories" :icon="TablerIconConstants.category" :route="RouteConstants.ROUTE_CATEGORY_LIST" />
      </div>

      <div class="nav-section mt-auto">
        <profile-picker-desktop-button />
        <div class="section-label">Settings</div>
        <app-left-sidebar-page label="Settings" :icon="TablerIconConstants.settings" :route="RouteConstants.ROUTE_SETTINGS" />
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
// const appStore = useAppStore() // Removed unused store if not needed, or keep if implicit global
const route = useRoute()
</script>

<style scoped>

</style>
