<template>
  <app-select
    :label="$t('transaction_type')"
    :popupTitle="$t('transaction_type_popup')"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
  >
    <template #item="{ item }">
      <div class="flex-center-vertical gap-2">
        <component :is="getIconComponentForType(item)" :size="24" :class="getClass(item)" />
        {{ $t(item.t) }}
      </div>
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center-vertical gap-2">
        <component :is="getIconComponentForType(item)" :size="16" :class="getClass(item)" />
        {{ $t(item.t) }}
      </div>
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'
import Transaction from '~/models/Transaction.js'
import { IconHexagonPlusFilled, IconHexagonMinusFilled, IconHexagonLetterTFilled } from '@tabler/icons-vue'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Transaction.typesList

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
      return 'text-danger'
    case Transaction.types.income.code:
      return 'text-success'
    case Transaction.types.transfer.code:
      return 'text-primary'
  }
}

const showDropdown = ref(null)
</script>
