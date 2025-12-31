<template>
  <div class="app-left-sidebar">
    <div class="flex-center-vertical p-1 border border-radius">
      <app-icon :icon="TablerIconConstants.dashboardTotalIncomes" :size="20" />
      Add transaction
    </div>

    <app-left-sidebar-page label="Dashboard22" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_DASHBOARD" />
    <app-left-sidebar-page label="Transactions" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_TRANSACTION_LIST" />

    <div class="text-muted">Extras</div>

    <app-left-sidebar-page label="Accounts" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_ACCOUNT_LIST" />
    <app-left-sidebar-page label="Templates" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST" />
    <app-left-sidebar-page label="Budgets" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_BUDGET_LIST" />


    <div class="text-muted">Clasifications</div>
    <app-left-sidebar-page label="Tags" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_TAG_LIST" />
    <app-left-sidebar-page label="Categories" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_CATEGORY_LIST" />

    <div class="text-muted">Settings</div>
    <app-left-sidebar-page label="Settings" :icon="TablerIconConstants.dashboard" :route="RouteConstants.ROUTE_SETTINGS" />
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
</script>
