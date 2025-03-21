<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">{{ $t('primary') }}:</div>
      <app-field-link :label="$t('accounts')" :icon="TablerIconConstants.account" @click="onGoToAccountsList" />
      <app-field-link :label="$t('template')" :icon="TablerIconConstants.transactionTemplate" @click="onGoToTransactionTemplatesList" />
      <app-field-link :label="$t('budgets')" :icon="TablerIconConstants.budget" @click="onGoToBudgetsList" />
    </van-cell-group>

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">{{ $t('classification') }}:</div>
      <app-field-link :label="$t('tags')" :icon="TablerIconConstants.tag" @click="onGoToTagsList" />
      <app-field-link :label="$t('categories')" :icon="TablerIconConstants.category" @click="onGoToCategoriesList" />
    </van-cell-group>

    <van-cell-group inset style="overflow: auto">
      <div class="van-cell-group-title">{{ $t('extra') }}:</div>
      <app-field-link :label="$t('exchange_rates')" :icon="TablerIconConstants.exchangeRates" @click="navigateTo(RouteConstants.ROUTE_EXCHANGE_RATES)" />
      <app-field-link :label="$t('currencies')" :icon="TablerIconConstants.currency" @click="onGoToCurrenciesList" />
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

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({ title: t('toolbar.extras') })

onMounted(() => {
  animateSettings()
})
</script>
