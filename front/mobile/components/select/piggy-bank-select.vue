<template>
  <app-select v-model="modelValue" :label="label ?? $t('piggy_bank')" :popup-title="$t('piggy_bank_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
        <span v-if="isLoading" class="mx-spin" />
        <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
      </button>
    </template>
  </app-select>
</template>

<script setup>
import { IconRefresh } from '@tabler/icons-vue'
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

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await store.fetchPiggyBanks()
  isLoading.value = false
}
</script>
