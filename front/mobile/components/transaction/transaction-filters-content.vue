<template>
  <div class="mx-form mx-fform">
    <div v-if="showType" class="mx-f">
      <div class="mx-l">{{ $t('transaction_type') }}</div>
      <app-tabs v-model="transactionTypeCode" :items="typeItems" />
    </div>

    <app-field v-model="description" :label="$t('description')" :placeholder="$t('description')" />

    <account-select v-model="account" :is-multi-select="true" />

    <div class="flex flex-col gap-1">
      <category-select v-model="category" :disabled="!!withoutCategory" />
      <app-checkbox v-model="withoutCategory" :label="$t('transaction_list_page.without_category')" />
    </div>

    <div class="flex flex-col gap-1">
      <tag-select v-model="tag" :disabled="!!withoutTag" :is-multi-select="false" :auto-select-parents="false" />
      <app-checkbox v-model="withoutTag" :label="$t('transaction_list_page.without_tag')" />
    </div>

    <div class="flex flex-col gap-1">
      <budget-select v-model="budget" :disabled="!!withoutBudget" />
      <app-checkbox v-model="withoutBudget" :label="$t('transaction_list_page.without_budget')" />
    </div>

    <template v-if="showDate">
      <div class="mx-2">
        <app-date v-model="dateStart" :label="$t('date_after')" />
        <app-date v-model="dateEnd" :label="$t('date_before')" />
      </div>

      <div class="grid grid-cols-3 gap-2 -mt-2">
        <button type="button" class="mx-btn out sm" @click="onSubMonth">{{ $t('sub_month') }}</button>
        <button type="button" class="mx-btn out sm" @click="onCurrentMonth">{{ $t('this_month') }}</button>
        <button type="button" class="mx-btn out sm" @click="onAddMonth">{{ $t('add_month') }}</button>
      </div>
    </template>

    <div class="mx-2">
      <app-field v-model="amountStart" :label="$t('amount_min')" :placeholder="$t('amount_min')" inputmode="decimal" />
      <app-field v-model="amountEnd" :label="$t('amount_max')" :placeholder="$t('amount_max')" inputmode="decimal" />
    </div>
  </div>
</template>

<script setup>
import { generateChildren } from '~/core/utils/VueUtils'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import Transaction from '~/core/models/Transaction.js'

const modelValue = defineModel({})
defineProps({
  showDate: { default: true },
  showType: { default: true },
})

const { t } = useI18n()

const { description, dateStart, dateEnd, amountStart, amountEnd, category, withoutCategory, tag, withoutTag, account, transactionType, withoutBudget, budget } = generateChildren(modelValue, [
  'description',
  'dateStart',
  'dateEnd',
  'amountStart',
  'amountEnd',
  'category',
  'withoutCategory',
  'withoutTag',
  'tag',
  'withoutBudget',
  'budget',
  'account',
  'transactionType',
])

// The segmented control works on codes; the filter keeps the whole type object
const typeItems = computed(() => [{ label: t('transaction.type.all'), value: '' }, ...Transaction.typesList.map((type) => ({ label: t(type.t), value: type.code }))])
const transactionTypeCode = computed({
  get: () => transactionType.value?.code ?? '',
  set: (code) => (transactionType.value = Transaction.typesList.find((type) => type.code === code) ?? null),
})

const onSubMonth = () => {
  dateStart.value = addMonths(dateStart.value ?? startOfMonth(new Date()), -1)
  dateEnd.value = endOfMonth(addMonths(dateEnd.value ?? endOfMonth(new Date()), -1))
}

const onCurrentMonth = () => {
  dateStart.value = startOfMonth(new Date())
  dateEnd.value = endOfMonth(new Date())
}

const onAddMonth = () => {
  dateStart.value = addMonths(dateStart.value ?? startOfMonth(new Date()), 1)
  dateEnd.value = endOfMonth(addMonths(dateEnd.value ?? endOfMonth(new Date()), 1))
}
</script>
