<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('account')"
    :popup-title="$t('account_select.title')"
    :list="allowedList"
    :is-multi-select="isMultiSelect"
    :get-display-value="getDisplayValue"
    :get-icon-value="getIcon"
    :get-meta-value="getMeta"
  >
    <template #top-right>
      <app-refresh-button :refresh="accountStore.fetchAccounts" />
    </template>

    <template #popup="{ onSelectCell, list, isItemSelected }">
      <template v-for="group in getGroups(list)" :key="group.title">
        <div class="mx-ogrp">{{ group.title }}</div>
        <button v-for="item in group.items" :key="item.id" type="button" class="mx-opt" :class="{ on: isItemSelected(item) }" :aria-pressed="isItemSelected(item)" @click="onSelectCell(item)">
          <span v-if="isMultiSelect" class="mx-ck" :class="{ on: isItemSelected(item) }"><app-icon :icon="IconCheck" :size="14" :stroke="3" /></span>
          <span class="ic"><app-icon :icon="getIcon(item)" :size="16" :stroke="2" /></span>
          <span class="lb">{{ getDisplayValue(item) }}</span>
          <span class="mt">{{ getMeta(item) }}</span>
          <span v-if="!isMultiSelect" class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
        </button>
      </template>
      <div v-if="getGroups(list).length === 0" class="mx-none">{{ search ? $t('no_matches') : $t('account_select.no_accounts') }}</div>
    </template>

    <template v-for="slot in Object.keys($slots)" #[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>
  </app-select>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'
import { isEqual } from 'lodash-es'
import { useAccountStore } from '~/core/stores/accountStore'
import Account from '~/core/models/Account.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

// Account picker (design: list sheet with the account icon and balance), grouped by account type.
const props = defineProps({
  label: { type: String },
  allowedTypes: { default: () => Account.typesList() },
  isMultiSelect: { default: false },
})

const accountStore = useAccountStore()
const { t } = useI18n()

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

const groupList = computed(() => [
  { type: Account.types.asset, title: t('account_select.asset_accounts') },
  { type: Account.types.expense, title: t('account_select.expense_accounts') },
  { type: Account.types.revenue, title: t('account_select.income_accounts') },
  { type: Account.types.liability, title: t('account_select.liability_accounts') },
])
const allowedGroups = computed(() => groupList.value.filter((group) => props.allowedTypes.some((type) => isEqual(type, group.type))))
const allowedList = computed(() => accountStore.accountList.filter((item) => allowedGroups.value.some((group) => isEqual(Account.getType(item), group.type))))

const getGroups = (list) =>
  allowedGroups.value.map((group) => ({ title: group.title, items: list.filter((item) => isEqual(Account.getType(item), group.type)) })).filter((group) => group.items.length > 0)

const getDisplayValue = (value) => Account.getDisplayName(value)
const getIcon = (value) => Account.getIcon(value) ?? TablerIconConstants.account
const getMeta = (value) => Account.getBalanceWithCurrency(value)
</script>
