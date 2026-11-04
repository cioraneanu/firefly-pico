<template>
  <div />
</template>

<script setup>
import Page from '~/core/models/Page'
import RouteConstants from '~/core/constants/RouteConstants'

const routes = {
  [Page.types.dashboard.code]: RouteConstants.ROUTE_DASHBOARD,
  [Page.types.transactionList.code]: RouteConstants.ROUTE_TRANSACTION_LIST,
}

navigateTo(routes[useProfileStore().startingPage?.code] ?? RouteConstants.ROUTE_TRANSACTION_ID, { replace: true })
</script>
