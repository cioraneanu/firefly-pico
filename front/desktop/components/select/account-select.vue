<template>
  <d-select
    v-model="model"
    :options
    :get-label="(item) => Account.getDisplayName(item)"
    :get-icon="(account) => Account.getIcon(account) ?? IconCreditCard"
    :get-group="(account) => $t(Account.getType(account)?.t ?? '')"
    :icon="IconCreditCard"
    :placeholder="$t('account_select.title')"
    :clearable
  />
</template>

<script setup>
import { IconCreditCard } from '@tabler/icons-vue'
import { sortBy } from 'lodash-es'
import Account from '~/core/models/Account'

const model = defineModel()
const props = defineProps({ allowedTypes: { type: Array, default: () => Account.typesList() }, clearable: Boolean })

const accountStore = useAccountStore()
const codes = computed(() => props.allowedTypes.map((type) => type.fireflyCode))
const options = computed(() =>
  sortBy(
    accountStore.accountList.filter((account) => codes.value.includes(Account.getType(account)?.fireflyCode)),
    (account) => codes.value.indexOf(Account.getType(account)?.fireflyCode),
  ),
)
</script>
