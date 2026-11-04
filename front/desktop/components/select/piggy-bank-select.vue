<template>
  <d-select
    v-model="model"
    :options="piggyBankStore.piggyBankList"
    :get-label="(item) => PiggyBank.getDisplayName(item)"
    :get-icon="(item) => PiggyBank.getIcon(item) ?? IconPigMoney"
    :icon="IconPigMoney"
    :placeholder="$t('piggy_bank_select')"
    clearable
  />
</template>

<script setup>
import { IconPigMoney } from '@tabler/icons-vue'
import PiggyBank from '~/core/models/PiggyBank'

const model = defineModel()
const piggyBankStore = usePiggyBankStore()
</script>
