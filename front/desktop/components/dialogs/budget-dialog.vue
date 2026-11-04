<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'budget_page.title_edit' : 'budget_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info stacked>
        <div class="flex items-center justify-between text-fg">
          <span>
            {{ $t('budget_page.spent') }}: <b class="font-medium tabular-nums">{{ form.limitSpent }} / {{ form.limitAmount }} {{ form.currencySymbol }}</b>
          </span>
          <span class="tabular-nums">{{ form.limitPercent }}%</span>
        </div>
        <d-progress :value="Number(form.limitPercent)" />
        <div class="flex items-center justify-between">
          <span>{{ $t('budget_page.interval') }}: {{ form.limitInterval }}</span>
          <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="-my-1 text-fg">{{ $t('show_transactions') }}</d-button>
        </div>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
    <d-field :label="$t('budget_page.type')" :rules="[rule.required()]" :value="form.type">
      <d-enum-select v-model="form.type" :options="Budget.typesList()" />
    </d-field>
    <template v-if="form.isPeriodVisible">
      <d-field :label="$t('budget_page.period')" :rules="[rule.required()]" :value="form.period">
        <d-enum-select v-model="form.period" :options="Budget.periodsList()" />
      </d-field>
      <d-field :label="$t('currency')" :rules="[rule.required()]" :value="form.currency">
        <d-currency-select v-model="form.currency" />
      </d-field>
      <d-field :label="$t('amount')" :rules="[rule.required()]" :value="form.amount">
        <d-input v-model="form.amount" type="number" step="0.01" class="max-w-50" />
      </d-field>
    </template>
    <div class="h-px bg-line" />
    <d-field :label="$t('active')">
      <d-switch v-model="form.active" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import { IconCoins } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Budget from '~/core/models/Budget'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_BUDGET_LIST)
const form = reactive(useBudgetForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
