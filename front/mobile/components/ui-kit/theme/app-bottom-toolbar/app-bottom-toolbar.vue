<template>
  <nav class="mx-nav" :class="{ hidden: isKeyboardVisible }" :aria-label="$t('toolbar.home')">
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_DASHBOARD" :icon="IconHome" :label="$t('toolbar.home')" />
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_TRANSACTION_LIST" :icon="IconListDetails" :label="$t('toolbar.transactions')" />
    <a class="mx-nav__add" :href="RouteConstants.ROUTE_TRANSACTION_ID" :aria-label="$t('transaction.title_add_transaction')" @click.prevent="navigateTo(RouteConstants.ROUTE_TRANSACTION_ID)">
      <span class="add"><app-icon :icon="IconPlus" :size="22" :stroke="2.25" /></span>
    </a>
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_EXTRAS" :icon="IconLayoutGrid" :label="$t('toolbar.extras')" />
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_SETTINGS" :icon="IconSettings" :label="$t('toolbar.settings')" :dot="appStore.isNewVersionAvailable" />
  </nav>
</template>

<script setup>
import { IconHome, IconLayoutGrid, IconListDetails, IconPlus, IconSettings } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants.js'

const appStore = useAppStore()
const { isKeyboardVisible } = useKeyboard()
</script>
