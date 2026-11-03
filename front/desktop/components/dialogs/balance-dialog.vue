<template>
  <d-dialog open :title="$t('account_page.adjust_balance')" :description="Account.getDisplayName(account)" size="sm" @close="emit('close')">
    <d-form :id="formId" @submit="save">
      <d-field :label="$t('account_page.balance')" :rules="[rule.required()]" :value="balance">
        <d-input v-model="balance" type="number" step="0.01" :suffix="Account.getCurrencySymbol(account)" autofocus />
      </d-field>
    </d-form>
    <template #footer>
      <d-button @click="emit('close')">{{ $t('cancel') }}</d-button>
      <d-button variant="primary" type="submit" :form="formId" :loading="isSaving">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { get } from 'lodash-es'
import Account from '~/core/models/Account'
import AccountRepository from '~/core/repository/AccountRepository'
import AccountTransformer from '~/core/transformers/AccountTransformer'
import { rule } from '~/core/utils/ValidationUtils'

const props = defineProps({ account: Object })
const emit = defineEmits(['close', 'saved'])
const { t } = useI18n()

const accountStore = useAccountStore()
const formId = useId()
const balance = ref(Account.getBalance(props.account))
const isSaving = ref(false)

const save = async () => {
  isSaving.value = true
  const response = await new AccountRepository().adjustBalance(props.account, balance.value)
  isSaving.value = false
  if (!ResponseUtils.isSuccess(response)) return

  const account = AccountTransformer.transformFromApi(get(response, 'data.data'))
  accountStore.accountList = accountStore.accountList.map((item) => (item.id === account.id ? account : item))
  UIUtils.showToastSuccess(t('success'))
  emit('saved', account)
  emit('close')
}
</script>
