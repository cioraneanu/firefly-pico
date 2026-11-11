<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <template v-if="itemId">
          <app-card :title="$t('status')" :form="false">
            <template #actions>
              <span v-if="budgetCurrencySymbol" class="mx-badge">{{ budgetCurrencySymbol }}</span>
            </template>
            <div class="mx-stat3">
              <div class="mx-stat">
                <span>{{ $t('budget_page.spent') }}</span>
                <b>{{ budgetLimitSpent }} / {{ budgetLimitAmount }}</b>
              </div>
              <div class="mx-stat">
                <span>{{ $t('budget_page.percent') }}</span>
                <b>{{ budgetLimitPercent }} %</b>
              </div>
              <div class="mx-stat">
                <span>{{ $t('budget_page.interval') }}</span>
                <b>{{ budgetLimitInterval }}</b>
              </div>
            </div>
            <div class="mx-prog" style="margin-top: 12px"><span :class="{ over: budgetLimitPercent >= 100 }" :style="{ width: `${Math.min(budgetLimitPercent, 100)}%` }" /></div>
          </app-card>

          <app-card-info>
            <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
          </app-card-info>
        </template>

        <app-card>
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <icon-select v-model="icon" />

          <budget-type-select v-model="type" name="budgetType" :rules="[rule.required()]" required />

          <template v-if="isPeriodVisible">
            <div class="mx-2">
              <budget-period-select v-model="period" name="budgetPeriod" :rules="[rule.required()]" required />
              <currency-select v-model="currency" name="currency" :rules="[rule.required()]" required />
            </div>
            <app-field v-model="amount" name="amount" type="number" :label="$t('amount')" :rules="[rule.required()]" required>
              <template #right>
                <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
              </template>
            </app-field>
          </template>

          <div class="mx-hr" />
          <app-boolean v-model="active" :label="$t('active')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'
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

const currencySymbol = computed(() => Currency.getSymbol(currency.value))
const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const { t } = useI18n()
useToolbar().init({
  title: itemId.value ? t('budget_page.title_edit') : t('budget_page.title_add'),
  backRoute: RouteConstants.ROUTE_BUDGET_LIST,
})
</script>
