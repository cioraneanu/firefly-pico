<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-card-info v-if="itemId">
      <app-field-link :label="adjustBalanceText" :icon="TablerIconConstants.extras" @click="onAdjustBalance" />
      <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
    </app-card-info>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="name" name="Description" :label="$t('description')" type="textarea" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" required/>

        <icon-select v-model="icon" default-tab="avatars" />

        <currency-select v-model="currency" name="curerency" :rules="[rule.required()]" required />

        <account-type-select v-model="type" name="accountType" :rules="[rule.required()]" required />
        <account-role-select v-if="isRoleVisible" v-model="role" name="accountRoleSelect" :rules="[rule.required()]" required />

        <account-liability-type-select v-if="isLiability" v-model="liabilityType" name="accountLiabilityType" :rules="[rule.required()]" required />
        <account-liability-direction-select v-if="isLiability" v-model="liabilityDirection" name="accountLiabilityDirection" :rules="[rule.required()]" required />

<!--        <app-field v-model="group" name="Description" :label="$t('account_page.account_group')" :icon="TablerIconConstants.fieldText2"> </app-field>-->
        <app-field-dropdown v-model="group" :list="getGroupList" name="Description" :label="$t('account_page.account_group')" :icon="TablerIconConstants.fieldText2"/>

        <app-boolean v-model="includeNetWorth" :label="$t('account_page.include_net_worth')" />

        <app-boolean v-model="isDashboardVisible" :label="$t('account_page.visible_on_dashboard')" />
      </van-cell-group>

      <div style="margin: 16px" class="">
        <app-button-form-save />
        <app-button-form-delete v-if="itemId" class="mt-2.5" @click="onDelete" />
      </div>
    </van-form>

    <account-adjust-balance v-model:show-dropdown="isAdjustBalanceVisible" :value="item" @result="onEvent" />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import AccountTypeSelect from '~/mobile/components/select/account/account-type-select.vue'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'
import AppFieldDropdown from '~/mobile/components/ui-kit/app-field-dropdown.vue'

const { t } = useI18n()
const isAdjustBalanceVisible = ref(false)

const {
  itemId,
  item,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
  formName,
  sync: onEvent,
  name,
  type,
  role,
  currency,
  icon,
  includeNetWorth,
  isDashboardVisible,
  liabilityType,
  liabilityDirection,
  group,
  isRoleVisible,
  isLiability,
  transactionsRoute,
  getGroups: getGroupList,
} = useAccountForm()

const adjustBalanceText = computed(() => `${t('account_page.adjust_balance')} (${Account.getBalance(item.value)} ${item.value?.attributes?.currency_symbol ?? ''})`)
const onAdjustBalance = () => (isAdjustBalanceVisible.value = true)
const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const toolbar = useToolbar()
toolbar.init({
  title: itemId.value ? t('account_page.title_edit') : t('account_page.title_add'),
  leftText: t('list'),
  backRoute: RouteConstants.ROUTE_ACCOUNT_LIST,
})
</script>
