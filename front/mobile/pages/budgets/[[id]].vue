<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <app-card-info v-if="itemId">
        <div class="van-cell-group-title">{{ $t('status') }}:</div>
        <div class="px-4 pb-3.75 flex-col text-12">
          <div>{{ $t('budget_page.spent') }}: {{ budgetLimitSpent }} / {{ budgetLimitAmount }} {{ budgetCurrencySymbol }}</div>
          <div>{{ $t('budget_page.percent') }}: {{ budgetLimitPercent }} %</div>
          <div>{{ $t('budget_page.interval') }}: {{ budgetLimitInterval }}</div>
        </div>
        <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="name" name="Name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />

        <budget-type-select v-model="type" name="budgetType" :rules="[rule.required()]" required />

        <template v-if="isPeriodVisible">
          <budget-period-select v-model="period" name="budgetPeriod" :rules="[rule.required()]" required />
          <currency-select v-model="currency" name="currency" :rules="[rule.required()]" required />
          <app-field v-model="amount" name="amount" :label="$t('amount')" :icon="TablerIconConstants.cashBanknote" :rules="[rule.required()]" />
        </template>

        <app-boolean v-model="active" :label="$t('active')" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-2.5" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const {
  itemId,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
  formName,
  name,
  icon,
  type,
  period,
  currency,
  amount,
  active,
  isPeriodVisible,
  limitPercent: budgetLimitPercent,
  limitSpent: budgetLimitSpent,
  limitAmount: budgetLimitAmount,
  limitInterval: budgetLimitInterval,
  currencySymbol: budgetCurrencySymbol,
  transactionsRoute,
} = useBudgetForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('budget_page.title_edit') : t('budget_page.title_add'),
  backRoute: RouteConstants.ROUTE_BUDGET_LIST,
})
</script>
