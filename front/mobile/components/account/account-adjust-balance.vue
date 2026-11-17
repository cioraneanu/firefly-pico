<template>
  <app-sheet v-model:show="showDropdown" :title="$t('account_page.adjust_balance')">
    <template #top>
      <p class="mx-sh__d">{{ accountName }}</p>
    </template>

    <div class="mx-form">
      <div class="mx-kv">
        <div>
          <span>{{ $t('account_page.current_balance') }}</span>
          <b class="mx-money">{{ currentBalance }}</b>
        </div>
      </div>

      <div class="mx-f">
        <div class="mx-l">{{ $t('account_page.new_balance') }}</div>
        <label class="mx-in mx-amt-in">
          <app-icon :icon="IconScale" :size="16" :stroke="2" />
          <input v-model="newAmount" type="text" inputmode="decimal" placeholder="0" :aria-label="$t('account_page.new_balance')" />
          <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
        </label>
      </div>

      <div class="mx-kv">
        <div>
          <span>{{ $t('account_page.difference') }}</span>
          <b class="mx-money">{{ difference }}</b>
        </div>
      </div>

      <div class="mx-note">
        <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
        <span>{{ $t('account_page.adjust_balance_note') }}</span>
      </div>
    </div>

    <template #footer>
      <button type="button" class="mx-btn out" @click="showDropdown = false">{{ $t('cancel') }}</button>
      <button type="button" class="mx-btn pri" @click="onSave">{{ $t('save') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
import { IconInfoCircle, IconScale } from '@tabler/icons-vue'
import AccountRepository from '~/core/repository/AccountRepository.js'
import Account from '~/core/models/Account.js'

const showDropdown = defineModel('showDropdown', { type: Boolean, default: false })

const props = defineProps({
  value: {},
})

const emits = defineEmits(['result'])

const newAmount = ref('0')

const accountName = computed(() => Account.getDisplayName(props.value))
const currencySymbol = computed(() => Account.getCurrencySymbol(props.value))
const currentBalance = computed(() => Account.getBalanceWithCurrency(props.value))
const difference = computed(() => Account.getAmountWithCurrency(props.value, (parseFloat(newAmount.value) || 0) - (parseFloat(Account.getBalance(props.value)) || 0)))

watch(showDropdown, () => {
  newAmount.value = Account.getBalance(props.value)
})

const onSave = async () => {
  const response = await new AccountRepository().adjustBalance(props.value, newAmount.value)
  emits('result', 'onPostSave', response)
  showDropdown.value = false
}
</script>
