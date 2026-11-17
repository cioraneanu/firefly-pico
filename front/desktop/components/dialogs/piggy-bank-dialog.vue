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
        <div class="flex items-center justify-between gap-2">
          <span>{{ $t('piggy_bank_page.left_to_save') }}: {{ form.stats.left }} {{ form.stats.symbol }}</span>
          <span class="flex gap-2">
            <d-button size="sm" :icon="IconPlus" @click="form.openMoney(true)">{{ $t('piggy_bank_page.add_money') }}</d-button>
            <d-button size="sm" :icon="IconMinus" @click="form.openMoney(false)">{{ $t('piggy_bank_page.remove_money') }}</d-button>
          </span>
        </div>
      </d-info>
      <d-dialog :open="form.money.isOpen" :title="$t('piggy_bank_page.move_money')" :description="form.name" size="sm" @close="form.money.isOpen = false">
        <d-tabs v-model="form.money.isAdd" :options="moneyDirections" block />
        <d-field :label="$t('amount')">
          <d-input v-model="form.money.amount" type="number" step="0.01" min="0" placeholder="0.00" autofocus @keydown.enter="form.canApplyMoney && form.applyMoney()" />
        </d-field>
        <dl class="flex flex-col divide-y divide-line text-sm">
          <div v-if="form.account" class="flex justify-between gap-3 py-2">
            <dt class="text-dim">{{ $t('piggy_bank_page.available_in', { name: Account.getDisplayName(form.account) }) }}</dt>
            <dd class="font-medium tabular-nums">{{ form.moneyAccountBalance }} {{ form.stats.symbol }}</dd>
          </div>
          <div class="flex justify-between gap-3 py-2">
            <dt class="text-dim">{{ $t('piggy_bank_page.saved_after') }}</dt>
            <dd class="font-medium tabular-nums">{{ Math.max(form.moneySavedAfter, 0) }} {{ form.stats.symbol }}</dd>
          </div>
        </dl>
        <p v-if="form.isMoneyTooMuch" class="flex items-center gap-2 text-sm text-danger">
          <icon-alert-triangle :size="16" />{{ $t('piggy_bank_page.remove_too_much', { amount: `${form.stats.current} ${form.stats.symbol}` }) }}
        </p>
        <template #footer>
          <d-button @click="form.money.isOpen = false">{{ $t('cancel') }}</d-button>
          <d-button variant="primary" :icon="IconCheck" :disabled="!form.canApplyMoney" @click="form.applyMoney">{{ $t(form.money.isAdd ? 'add' : 'piggy_bank_page.remove') }}</d-button>
        </template>
      </d-dialog>
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
import { IconAlertTriangle, IconCheck, IconMinus, IconPlus } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_PIGGY_BANK_LIST)
const { t } = useI18n()
const moneyDirections = computed(() => [
  { label: t('piggy_bank_page.add_money'), value: true },
  { label: t('piggy_bank_page.remove_money'), value: false },
])
const form = reactive(usePiggyBankForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
