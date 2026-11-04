<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" :name="formName" @submit="saveItem" @failed="onValidationError" class="">
      <app-card-info v-if="itemId">
        <div class="van-cell-group-title">{{ $t('status') }}:</div>
        <div class="px-4 pb-3.75 flex-col text-12">
          <div>{{ $t('piggy_bank_page.saved') }}: {{ piggyBankCurrentAmount }} / {{ piggyBankTargetAmount }} {{ piggyBankCurrencySymbol }}</div>
          <div>{{ $t('piggy_bank_page.percent') }}: {{ piggyBankPercent }} %</div>
          <div>{{ $t('piggy_bank_page.left_to_save') }}: {{ piggyBankLeftToSave }} {{ piggyBankCurrencySymbol }}</div>
        </div>
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="name" name="Name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />

        <account-select v-model="account" name="account" :allowed-types="accountAllowedTypes" :rules="[rule.required()]" required />

        <app-field v-model="targetAmount" name="targetAmount" :label="$t('piggy_bank_page.target_amount')" type="number" :icon="TablerIconConstants.cashBanknote" :rules="[rule.required()]" />
        <app-field v-model="currentAmount" name="currentAmount" :label="$t('piggy_bank_page.current_amount')" type="number" :icon="TablerIconConstants.cash" />

        <app-date v-model="startDate" :label="$t('piggy_bank_page.start_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />
        <app-date v-model="targetDate" :label="$t('piggy_bank_page.target_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />

        <app-field v-model="notes" name="notes" :label="$t('notes')" rows="2" autosize :icon="TablerIconConstants.description" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete class="mt-2.5" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const { itemId, saveItem, onDelete, onNew, onValidationError, formName, name, icon, account, targetAmount, currentAmount, startDate, targetDate, notes, stats, accountAllowedTypes } = usePiggyBankForm()

const piggyBankCurrentAmount = computed(() => stats.value.current)
const piggyBankTargetAmount = computed(() => stats.value.target)
const piggyBankPercent = computed(() => stats.value.percent)
const piggyBankLeftToSave = computed(() => stats.value.left)
const piggyBankCurrencySymbol = computed(() => stats.value.symbol)

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('piggy_bank_page.title_edit') : t('piggy_bank_page.title_add'),
  backRoute: RouteConstants.ROUTE_PIGGY_BANK_LIST,
})
</script>
