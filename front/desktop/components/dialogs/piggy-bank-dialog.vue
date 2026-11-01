<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'piggy_bank_page.title_edit' : 'piggy_bank_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info stacked>
        <div class="flex items-center justify-between text-fg">
          <span>
            {{ $t('piggy_bank_page.saved') }}: <b class="font-medium tabular-nums">{{ form.stats.current }} / {{ form.stats.target }} {{ form.stats.symbol }}</b>
          </span>
          <span class="tabular-nums">{{ form.stats.percent }}%</span>
        </div>
        <d-progress :value="Number(form.stats.percent)" />
        <span>{{ $t('piggy_bank_page.left_to_save') }}: {{ form.stats.left }} {{ form.stats.symbol }}</span>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
    <d-field :label="$t('account')" :rules="[rule.required()]" :value="form.account">
      <d-account-select v-model="form.account" :allowed-types="form.accountAllowedTypes" />
    </d-field>
    <d-field :label="$t('piggy_bank_page.target_amount')" :rules="[rule.required()]" :value="form.targetAmount">
      <d-input v-model="form.targetAmount" type="number" step="0.01" class="max-w-50" />
    </d-field>
    <d-field :label="$t('piggy_bank_page.current_amount')">
      <d-input v-model="form.currentAmount" type="number" step="0.01" class="max-w-50" />
    </d-field>
    <d-field :label="$t('piggy_bank_page.start_date')">
      <d-date v-model="form.startDate" clearable />
    </d-field>
    <d-field :label="$t('piggy_bank_page.target_date')">
      <d-date v-model="form.targetDate" clearable />
    </d-field>
    <d-field :label="$t('notes')" top>
      <d-textarea v-model="form.notes" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_PIGGY_BANK_LIST)
const form = reactive(usePiggyBankForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
