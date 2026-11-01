<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'account_page.title_edit' : 'account_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info>
        <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="text-fg">{{ $t('show_transactions') }}</d-button>
        <d-button variant="ghost" size="sm" :icon="IconAdjustments" class="text-fg" @click="isBalanceOpen = true">{{ $t('account_page.adjust_balance') }}</d-button>
        <span class="ml-auto pr-1.5">
          {{ $t('account_page.balance') }}: <b class="font-medium tabular-nums text-fg">{{ Account.getBalanceWithCurrency(form.item) }}</b>
        </span>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" default-tab="avatars" />
    </d-field>
    <d-field :label="$t('currency')" :rules="[rule.required()]" :value="form.currency">
      <d-currency-select v-model="form.currency" />
    </d-field>
    <d-field :label="$t('account_page.account_type')" :rules="[rule.required()]" :value="form.type">
      <d-enum-select v-model="form.type" :options="Account.typesList()" />
    </d-field>
    <d-field v-if="form.isRoleVisible" :label="$t('account_page.account_role')" :rules="[rule.required()]" :value="form.role">
      <d-enum-select v-model="form.role" :options="Account.roleAssetsList()" />
    </d-field>
    <template v-if="form.isLiability">
      <d-field :label="$t('account_page.liability_type')" :rules="[rule.required()]" :value="form.liabilityType">
        <d-enum-select v-model="form.liabilityType" :options="Account.liabilityTypesList()" />
      </d-field>
      <d-field :label="$t('account_page.liability_direction')" :rules="[rule.required()]" :value="form.liabilityDirection">
        <d-enum-select v-model="form.liabilityDirection" :options="Account.liabilityDirectionsList()" />
      </d-field>
    </template>
    <d-field :label="$t('account_page.account_group')">
      <d-input v-model="form.group" :options="groups" />
    </d-field>
    <div class="h-px bg-line" />
    <d-field :label="$t('account_page.include_net_worth')">
      <d-switch v-model="form.includeNetWorth" />
    </d-field>
    <d-field :label="$t('account_page.visible_on_dashboard')">
      <d-switch v-model="form.isDashboardVisible" />
    </d-field>
  </d-form-dialog>

  <d-balance-dialog v-if="isBalanceOpen" :account="form.item" @close="isBalanceOpen = false" />
</template>

<script setup>
import { IconAdjustments, IconCoins } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_ACCOUNT_LIST)
const form = reactive(useAccountForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))

const isBalanceOpen = ref(false)
const groups = ref([])
onMounted(async () => (groups.value = await form.getGroups('')))
</script>
