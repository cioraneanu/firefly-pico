<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 flex-col overflow-auto p-4 gap-2">
      <app-field v-model="description" :label="$t('description')" :placeholder="$t('description')" />

      <template v-if="showType">
        <transaction-type-select v-model="transactionType" />
      </template>

      <div class="flex van-cell-fake pl-4 items-baseline">
        <div class="flex flex-col gap-4 items-center">
          <div class="text-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutCategory" shape="square" />
        </div>
        <category-select v-model="category" :disabled="!!withoutCategory" class="flex-1" />
      </div>

      <div class="flex van-cell-fake pl-4 items-baseline">
        <div class="flex flex-col gap-4 items-center">
          <div class="text-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutTag" shape="square" />
        </div>
        <tag-select v-model="tag" :disabled="!!withoutTag" class="flex-1" :is-multi-select="false" :auto-select-parents="false" />
      </div>

      <div class="flex van-cell-fake pl-4 items-baseline">
        <div class="flex flex-col gap-4 items-center">
          <div class="text-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutBudget" shape="square" />
        </div>
        <budget-select v-model="budget" :disabled="!!withoutBudget" class="flex-1" :is-multi-select="false" :auto-select-parents="false" />
      </div>

      <account-select v-model="account" :isMultiSelect="true" />

      <template v-if="showDate">
        <div class="flex items-center">
          <app-date class="flex-1" v-model="dateStart" :label="$t('date_after')" />
          <app-date class="flex-1" v-model="dateEnd" :label="$t('date_before')" />
        </div>

        <div class="flex items-center gap-1 justify-center">
          <van-button size="small" @click="onSubMonth">{{ $t('sub_month') }}</van-button>
          <van-button size="small" @click="onCurrentMonth">{{ $t('this_month') }}</van-button>
          <van-button size="small" @click="onAddMonth">{{ $t('add_month') }}</van-button>
        </div>
      </template>

      <div class="flex">
        <app-field class="flex-1" v-model="amountStart" :label="$t('amount_min')" :placeholder="$t('amount_min')" />
        <app-field class="flex-1" v-model="amountEnd" :label="$t('amount_max')" :placeholder="$t('amount_max')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { generateChildren } from '~/core/utils/VueUtils'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'

const modelValue = defineModel({})
const props = defineProps({
  showDate: { default: true },
  showType: { default: true },
})

const { description, dateStart, dateEnd, amountStart, amountEnd, category, withoutCategory, tag, withoutTag, account, transactionType, withoutBudget, budget } = generateChildren(modelValue, [
  'description', 'dateStart', 'dateEnd', 'amountStart', 'amountEnd', 'category', 'withoutCategory', 'withoutTag', 'tag', 'withoutBudget', 'budget', 'account', 'transactionType'
])

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

