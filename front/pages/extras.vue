<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">Primary:</div>
      <app-field-link label="Accounts" :icon="TablerIconConstants.account" @click="onGoToAccountsList" />
      <app-field-link label="Transaction templates" :icon="TablerIconConstants.transactionTemplate" @click="onGoToTransactionTemplatesList" />
      <app-field-link label="Budgets" :icon="TablerIconConstants.budget" @click="onGoToBudgetsList" />
    </van-cell-group>

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">Classification:</div>
      <app-field-link label="Tags" :icon="TablerIconConstants.tag" @click="onGoToTagsList" />
      <app-field-link label="Categories" :icon="TablerIconConstants.category" @click="onGoToCategoriesList" />
    </van-cell-group>

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">Extra:</div>
      <app-field-link label="Exchange rates" :icon="TablerIconConstants.exchangeRates" @click="navigateTo(RouteConstants.ROUTE_EXCHANGE_RATES)" />
      <app-field-link label="Currencies" :icon="TablerIconConstants.currency" @click="onGoToCurrenciesList" />
    </van-cell-group>

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">Debug:</div>
      <app-field-link label="Action picker" :icon="TablerIconConstants.article" @click="showActionSheet" />
    </van-cell-group>

  </div>
</template>

<script setup>
import { useProfileStore } from '~/stores/profileStore'
import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { onMounted } from 'vue'
import { useActionSheet } from '~/composables/useActionSheet.js'

const onNavigateToCalendar = async () => await navigateTo(RouteConstants.ROUTE_CALENDAR)
const onNavigateToTransactionTemplate = async () => await navigateTo(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)
const onGoToAccountsList = async () => await navigateTo(RouteConstants.ROUTE_ACCOUNT_LIST)
const onGoToCategoriesList = async () => await navigateTo(RouteConstants.ROUTE_CATEGORY_LIST)
const onGoToTagsList = async () => await navigateTo(RouteConstants.ROUTE_TAG_LIST)
const onGoToCurrenciesList = async () => await navigateTo(RouteConstants.ROUTE_CURRENCY_LIST)
const onGoToTransactionTemplatesList = async () => await navigateTo(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)

const onGoToBudgetsList = async () => await navigateTo(RouteConstants.ROUTE_BUDGET_LIST)


const actionSheet = useActionSheet();

const showActionSheet = () => {
  actionSheet.show([
    { name: 'Option 1', callback: () => console.log('Option 1 selected') },
    { name: 'Option 2', callback: () => console.log('Option 2 selected') },
    { name: 'Cancel', callback: () => console.log('Cancelled') },
  ]);
};

const toolbar = useToolbar()
toolbar.init({ title: 'Extra' })

onMounted(() => {
  animateSettings()
})
</script>
