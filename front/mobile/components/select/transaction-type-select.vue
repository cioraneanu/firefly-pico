<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    :label="$t('transaction_type')"
    :popup-title="$t('transaction_type')"
    :list="list"
    :columns="1"
    :get-display-value="getDisplayValue"
    v-bind="dynamicAttrs"
    :has-search="false"
  >
    <template #item="{ item }">
      <div class="flex items-center gap-2">
        <component :is="getIconComponentForType(item)" :size="24" :class="getClass(item)" />
        {{ $t(item.t) }}
      </div>
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex items-center gap-2">
        <component :is="getIconComponentForType(item)" :size="16" :class="getClass(item)" />
        {{ $t(item.t) }}
      </div>
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/core/models/Account'
import { useFormAttributes } from '~/core/composables/useFormAttributes'
import Transaction from '~/core/models/Transaction.js'
import { IconHexagonPlusFilled, IconHexagonMinusFilled, IconHexagonLetterTFilled } from '@tabler/icons-vue'

const { t } = useI18n()

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Transaction.typesList

const getDisplayValue = (item) => t(item.t)

const getIconComponentForType = (transactionType) => {
  switch (transactionType.code) {
    case Transaction.types.expense.code:
      return IconHexagonMinusFilled
    case Transaction.types.income.code:
      return IconHexagonPlusFilled
    case Transaction.types.transfer.code:
      return IconHexagonLetterTFilled
  }
}

const getClass = (transactionType) => {
  switch (transactionType.code) {
    case Transaction.types.expense.code:
      return 'text-[#dc3545]'
    case Transaction.types.income.code:
      return 'text-[#28a745]'
    case Transaction.types.transfer.code:
      return 'text-[#007bff]'
  }
}

const showDropdown = ref(null)
</script>
