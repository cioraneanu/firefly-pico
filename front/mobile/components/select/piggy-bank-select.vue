<template>
  <app-select v-model="modelValue" :label="label ?? $t('piggy_bank')" :popup-title="$t('piggy_bank_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <app-refresh-button :refresh="store.fetchPiggyBanks" />
    </template>
  </app-select>
</template>

<script setup>
import { usePiggyBankStore } from '~/core/stores/piggyBankStore'
import PiggyBank from '~/core/models/PiggyBank'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

defineProps({
  label: { type: String },
})

const store = usePiggyBankStore()
const modelValue = defineModel()

const list = computed(() => store.piggyBankList)

const getDisplayValue = (value) => PiggyBank.getDisplayName(value)
const getIcon = (value) => PiggyBank.getIcon(value) ?? TablerIconConstants.piggyBank
</script>
