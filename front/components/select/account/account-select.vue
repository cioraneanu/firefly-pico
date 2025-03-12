<template>
  <app-select
    :label="label ?? $t('account')"
    :popupTitle="$t('account_select.title')"
    class=""
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    v-model:search="search"
    :list="accountList"
    :columns="3"
    :isMultiSelect="props.isMultiSelect"
    :getDisplayValue="getDisplayValue"
    v-bind="dynamicAttrs"
  >
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.account" :size="20" />
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center">
        <app-icon :icon="Account.getIcon(item) ?? TablerIconConstants.account" :size="20" />
        <span class="font-weight-400 text-size-12">{{ getDisplayValue(item) }}</span>
      </div>
    </template>

    <template #top-right>
      <van-button size="small" @click="onRefresh" class="">
        <app-icon :icon="TablerIconConstants.refresh" :stroke="1.7" size="14" />
      </van-button>
    </template>

    <template #popup="{ onSelectCell }">
      <div class="display-flex flex-column h-100">
        <template v-if="showAssets">
          <span class="account-select-section-title">{{ $t('account_select.asset_accounts') }}</span>
          <van-grid>
            <template v-for="(item, index) in assetAccountList" :key="index">
              <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                <template #default>
                  <app-select-option :text="Account.getDisplayName(item)" :icon="Account.getIcon(item) ?? TablerIconConstants.account" />
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </template>
        <template v-if="showExpense">
          <span class="account-select-section-title">{{ $t('account_select.expense_accounts') }}</span>
          <van-grid>
            <template v-for="(item, index) in expenseAccountList" :key="index">
              <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                <template #default>
                  <app-select-option :text="Account.getDisplayName(item)" :icon="Account.getIcon(item) ?? TablerIconConstants.account" />
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </template>
        <template v-if="showIncome">
          <span class="account-select-section-title">{{ $t('account_select.income_accounts') }}</span>
          <van-grid>
            <template v-for="(item, index) in incomeAccountList" :key="index">
              <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                <template #default>
                  <app-select-option :text="Account.getDisplayName(item)" :icon="Account.getIcon(item) ?? TablerIconConstants.account" />
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </template>
        <template v-if="showLiabilities">
          <span class="account-select-section-title">{{ $t('account_select.liability_accounts') }}</span>
          <van-grid>
            <template v-for="(item, index) in liabilityAccountList" :key="index">
              <van-grid-item @click="onSelectCell(item)" style="cursor: pointer" :class="getOptionClass(item)">
                <template #default>
                  <app-select-option :text="Account.getDisplayName(item)" :icon="Account.getIcon(item) ?? TablerIconConstants.account" />
                </template>
              </van-grid-item>
            </template>
          </van-grid>
        </template>
        <template v-if="!showAssets && !showExpense && !showIncome">
          <div class="flex-center text-muted text-size-12">{{ $t('account_select.no_accounts') }}</div>
        </template>
      </div>
    </template>

    <template v-for="slot in Object.keys($slots)" v-slot:[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>
  </app-select>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore.js'
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import { IconRefresh } from '@tabler/icons-vue'
import { isEqual } from 'lodash/lang'
import { useI18n } from 'vue-i18n'

import TablerIconConstants from '~/constants/TablerIconConstants.js'

const { t } = useI18n()
const dataStore = useDataStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
  },
  allowedTypes: {
    default: () => Account.typesList(),
  },
  isMultiSelect: {
    default: false,
  },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

let list = ref([])

const accountList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return Account.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

// TODO: Make a dictionary / list of accounts grouped by type. Could also remove the repetitive HTML with a v-for
const expenseAccountList = computed(() => accountList.value.filter((item) => isEqual(Account.getType(item), Account.types.expense)))
const assetAccountList = computed(() => accountList.value.filter((item) => isEqual(Account.getType(item), Account.types.asset)))
const incomeAccountList = computed(() => accountList.value.filter((item) => isEqual(Account.getType(item), Account.types.revenue)))
const liabilityAccountList = computed(() => accountList.value.filter((item) => isEqual(Account.getType(item), Account.types.liability)))

const showAssets = computed(() => props.allowedTypes.some((item) => isEqual(item, Account.types.asset)) && assetAccountList.value.length > 0)
const showExpense = computed(() => props.allowedTypes.some((item) => isEqual(item, Account.types.expense)) && expenseAccountList.value.length > 0)
const showIncome = computed(() => props.allowedTypes.some((item) => isEqual(item, Account.types.revenue)) && incomeAccountList.value.length > 0)
const showLiabilities = computed(() => props.allowedTypes.some((item) => isEqual(item, Account.types.liability)) && incomeAccountList.value.length > 0)

// ------ Methods ------

onMounted(async () => {
  list.value = dataStore.accountList
})

// const onSelectCell = (account) => {
//   modelValue.value = account
//   showDropdown.value = false
// }

const getDisplayValue = (value) => {
  return Account.getDisplayName(value)
}

const isItemSelected = (option) => {
  if (!modelValue.value) {
    return false
  }
  if (props.isMultiSelect) {
    return modelValue.value.some((item) => isEqual(item, option))
  }
  return isEqual(modelValue.value, option)
}

const getOptionClass = (option) => {
  return {
    active: isItemSelected(option),
  }
}

const isLoading = ref(false)
UIUtils.showLoadingWhen(isLoading)
const onRefresh = async () => {
  isLoading.value = true
  await dataStore.fetchAccounts()
  isLoading.value = false
}
</script>

<style></style>
