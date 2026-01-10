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
.app-left-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem; /* p-4 equivalent */
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0; /* slate-200 */
  gap: 1.5rem;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.add-btn-wrapper {
  margin-bottom: 0.5rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-label {
  padding-left: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem; /* text-xs */
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8; /* slate-400 */
  letter-spacing: 0.05em;
}

.mt-auto {
  margin-top: auto;
}

/* Deep selector to style the child component (app-left-sidebar-page) */
:deep(a) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b; /* slate-500 */
  text-decoration: none;
  transition: all 0.2s ease;
}

:deep(a:hover) {
  background-color: #f1f5f9; /* slate-100 */
  color: #0f172a; /* slate-900 */
}

:deep(.router-link-active) {
  background-color: #f1f5f9; /* slate-100 */
  color: #0f172a; /* slate-900 */
}

/* Adjust icon inside link if needed */
:deep(a svg),
:deep(a i) {
  color: currentColor;
  opacity: 0.8;
}

/* Target the inner div of the app-left-sidebar-page component (which likely has .flex-center-vertical) */
:deep(a > div) {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Enforce consistent gap between icon and label */
}
</style>
