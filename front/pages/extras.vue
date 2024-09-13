<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <app-field-link label="Accounts" :icon="TablerIconConstants.account" @click="onGoToAccountsList" />

      <app-field-link label="Categories" :icon="TablerIconConstants.category" @click="onGoToCategoriesList" />

      <app-field-link label="Tags" :icon="TablerIconConstants.tag" @click="onGoToTagsList" />

      <app-field-link label="Transaction templates" :icon="TablerIconConstants.transactionTemplate" @click="onGoToTransactionTemplatesList" />

      <app-field-link label="Budgets" :icon="TablerIconConstants.budget" @click="onGoToBudgetsList" />

      <app-field-link label="Exchange rates" :icon="TablerIconConstants.exchangeRates" @click="navigateTo(RouteConstants.ROUTE_EXCHANGE_RATES)" />

      <!--      <app-field-link-->
      <!--          label="Currencies"-->
      <!--          :icon="IconifyConstants.currency"-->
      <!--          @click="onGoToCurrenciesList"-->
      <!--      />-->
    </van-cell-group>
  </div>
</template>


<script setup>
import { useProfileStore } from '~/stores/profileStore'
import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { onMounted } from 'vue'

const onNavigateToCalendar = async () => await navigateTo(RouteConstants.ROUTE_CALENDAR)
const onNavigateToTransactionTemplate = async () => await navigateTo(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)
const onGoToAccountsList = async () => await navigateTo(RouteConstants.ROUTE_ACCOUNT_LIST)
const onGoToCategoriesList = async () => await navigateTo(RouteConstants.ROUTE_CATEGORY_LIST)
const onGoToTagsList = async () => await navigateTo(RouteConstants.ROUTE_TAG_LIST)
const onGoToCurrenciesList = async () => await navigateTo(RouteConstants.ROUTE_CURRENCY_LIST)
const onGoToTransactionTemplatesList = async () => await navigateTo(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)

const onGoToBudgetsList = async () => await navigateTo(RouteConstants.ROUTE_BUDGET_LIST)

const toolbar = useToolbar()
toolbar.init({ title: 'Extra' })

onMounted(() => {
  animateSettings()
})

</script>
