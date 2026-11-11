<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <app-card v-if="itemId" :form="false" pad>
          <div class="mx-pig">
            <div class="mx-hero">
              <div class="mx-kpi">
                <small>{{ $t('piggy_bank_page.saved') }}</small>
                <b class="mx-money">{{ stats.current }} {{ stats.symbol }}</b>
              </div>
              <div class="mx-total">
                <span>{{ $t('piggy_bank_page.target_amount') }}</span>
                <b class="mx-money">{{ stats.target }} {{ stats.symbol }}</b>
              </div>
            </div>
            <span class="mx-prog"><span :style="{ width: `${Math.min(stats.percent, 100)}%` }" /></span>
            <span class="meta">
              <span>{{ stats.percent }} %</span>
              <span>{{ $t('piggy_bank_page.left_to_save') }}: {{ stats.left }} {{ stats.symbol }}</span>
            </span>
            <div class="mx-2 mt-1">
              <button type="button" class="mx-btn out" @click="openMoney(true)">
                <app-icon :icon="IconPlus" :size="16" :stroke="2" /><span>{{ $t('piggy_bank_page.add_money') }}</span>
              </button>
              <button type="button" class="mx-btn out" @click="openMoney(false)">
                <app-icon :icon="IconMinus" :size="16" :stroke="2" /><span>{{ $t('piggy_bank_page.remove_money') }}</span>
              </button>
            </div>
          </div>
        </app-card>

        <app-card>
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <icon-select v-model="icon" />

          <account-select v-model="account" name="account" :allowed-types="accountAllowedTypes" :rules="[rule.required()]" required />

          <div class="mx-2">
            <app-field v-model="targetAmount" name="targetAmount" type="number" :label="$t('piggy_bank_page.target_amount')" :rules="[rule.required()]" required>
              <template #right>
                <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
              </template>
            </app-field>
            <app-field v-model="currentAmount" name="currentAmount" type="number" :label="$t('piggy_bank_page.current_amount')">
              <template #right>
                <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
              </template>
            </app-field>
          </div>

          <div class="mx-2">
            <app-date v-model="startDate" :label="$t('piggy_bank_page.start_date')" />
            <app-date v-model="targetDate" :label="$t('piggy_bank_page.target_date')" />
          </div>

          <app-field v-model="notes" name="notes" type="textarea" rows="3" autosize :label="$t('notes')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>

    <app-sheet v-model:show="money.isOpen" :title="$t('piggy_bank_page.move_money')" :description="name">
      <div class="mx-form">
        <app-tabs v-model="money.isAdd" :items="moneyDirections" />
        <app-field v-model="money.amount" type="number" inputmode="decimal" :label="$t('amount')" placeholder="0">
          <template #left-icon>
            <app-icon :icon="IconCoins" :size="16" :stroke="2" />
          </template>
          <template #right>
            <span v-if="stats.symbol" class="suf">{{ stats.symbol }}</span>
          </template>
          <template #extra>
            <div class="mx-quick">
              <button v-for="value in [100, 500]" :key="value" type="button" class="mx-quick__b" @click="addToMoneyAmount(value)">+{{ value }}</button>
            </div>
          </template>
        </app-field>
        <div class="mx-kv">
          <div v-if="account">
            <span>{{ $t('piggy_bank_page.available_in', { name: Account.getDisplayName(account) }) }}</span>
            <b class="mx-money">{{ moneyAccountBalance }} {{ stats.symbol }}</b>
          </div>
          <div>
            <span>{{ $t('piggy_bank_page.saved_after') }}</span>
            <b class="mx-money">{{ Math.max(moneySavedAfter, 0) }} {{ stats.symbol }}</b>
          </div>
        </div>
        <div v-if="isMoneyTooMuch" class="mx-note text-[var(--destructive)]">
          <app-icon :icon="IconAlertTriangle" :size="16" :stroke="2" />
          <span>{{ $t('piggy_bank_page.remove_too_much', { amount: `${stats.current} ${stats.symbol}` }) }}</span>
        </div>
      </div>
      <template #footer>
        <button type="button" class="mx-btn out" @click="money.isOpen = false">{{ $t('cancel') }}</button>
        <button type="button" class="mx-btn pri" :disabled="!canApplyMoney" @click="applyMoney">
          <app-icon :icon="IconCheck" :size="16" :stroke="2" /><span>{{ $t(money.isAdd ? 'add' : 'piggy_bank_page.remove') }}</span>
        </button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { IconAlertTriangle, IconCheck, IconCoins, IconMinus, IconPlus } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import { useToolbar } from '~/mobile/composables/useToolbar'
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
  account,
  targetAmount,
  currentAmount,
  startDate,
  targetDate,
  notes,
  stats,
  accountAllowedTypes,
  money,
  moneySavedAfter,
  moneyAccountBalance,
  isMoneyTooMuch,
  canApplyMoney,
  openMoney,
  addToMoneyAmount,
  applyMoney,
} = usePiggyBankForm()

const { t } = useI18n()
const moneyDirections = computed(() => [
  { label: t('piggy_bank_page.add_money'), value: true },
  { label: t('piggy_bank_page.remove_money'), value: false },
])
const currencySymbol = computed(() => Account.getCurrencySymbol(account.value))

const route = useRoute()
useToolbar().init({
  title: computed(() => (itemId.value || route.params.id ? t('piggy_bank_page.title_edit') : t('piggy_bank_page.title_add'))),
  backRoute: RouteConstants.ROUTE_PIGGY_BANK_LIST,
})
</script>
