<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <app-card-info v-if="itemId">
          <app-field-link :label="$t('account_page.adjust_balance')" :icon="IconScale" @click="onAdjustBalance">
            <template #right>
              <span class="mx-row__v mx-money">{{ balance }}</span>
            </template>
          </app-field-link>
          <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
        </app-card-info>

        <app-card>
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <icon-select v-model="icon" default-tab="avatars" />

          <div class="mx-2">
            <currency-select v-model="currency" name="currency" :rules="[rule.required()]" required />
            <account-type-select v-model="type" name="accountType" :rules="[rule.required()]" required />
          </div>

          <div v-if="isLiability" class="mx-2">
            <account-liability-type-select v-model="liabilityType" name="accountLiabilityType" :rules="[rule.required()]" required />
            <account-liability-direction-select v-model="liabilityDirection" name="accountLiabilityDirection" :rules="[rule.required()]" required />
          </div>

          <div :class="{ 'mx-2': isRoleVisible }">
            <account-role-select v-if="isRoleVisible" v-model="role" name="accountRoleSelect" :rules="[rule.required()]" required />
            <app-field-dropdown v-model="group" :list="getGroupList" name="group" :label="$t('account_page.account_group')" />
          </div>
        </app-card>

        <app-card>
          <app-boolean v-model="includeNetWorth" :label="$t('account_page.include_net_worth')" />
          <div class="mx-hr" />
          <app-boolean v-model="isDashboardVisible" :label="$t('account_page.visible_on_dashboard')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>

    <account-adjust-balance v-model:show-dropdown="isAdjustBalanceVisible" :value="item" @result="onEvent" />
  </div>
</template>

<script setup>
import { IconScale } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

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

const balance = computed(() => Account.getBalanceWithCurrency(item.value))
const onAdjustBalance = () => (isAdjustBalanceVisible.value = true)
const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const route = useRoute()
useToolbar().init({
  title: computed(() => (itemId.value || route.params.id ? t('account_page.title_edit') : t('account_page.title_add'))),
  backRoute: RouteConstants.ROUTE_ACCOUNT_LIST,
})
</script>
