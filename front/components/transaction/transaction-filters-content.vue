<template>
  <div class="display-flex flex-column h-100">
    <div class="flex-1 flex-column overflow-auto p-3 gap-2">
      <app-field v-model="description" :label="$t('description')" :placeholder="$t('description')" />

      <template v-if="showType">
        <transaction-type-select v-model="transactionType" />
      </template>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutCategory" shape="square" />
        </div>
        <category-select v-model="category" :disabled="!!withoutCategory" class="flex-1" />
      </div>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutTag" shape="square" />
        </div>
        <tag-select v-model="tag" :disabled="!!withoutTag" class="flex-1" :is-multi-select="false" :auto-select-parents="false" />
      </div>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('without') }}</div>
          <app-checkbox v-model="withoutBudget" shape="square" />
        </div>
        <budget-select v-model="budget" :disabled="!!withoutBudget" class="flex-1" :is-multi-select="false" :auto-select-parents="false" />
      </div>

      <account-select v-model="account" :isMultiSelect="true" />

      <template v-if="showDate">
        <div class="flex-center-vertical">
          <app-date class="flex-1" v-model="dateStart" :label="$t('date_after')" />
          <app-date class="flex-1" v-model="dateEnd" :label="$t('date_before')" />
        </div>

        <div class="flex-center-vertical gap-1 justify-content-center">
          <van-button size="small" @click="onSubMonth">{{ $t('sub_month') }}</van-button>
          <van-button size="small" @click="onCurrentMonth">{{ $t('this_month') }}</van-button>
          <van-button size="small" @click="onAddMonth">{{ $t('add_month') }}</van-button>
        </div>
      </template>

      <div class="display-flex">
        <app-field class="flex-1" v-model="amountStart" :label="$t('amount_min')" :placeholder="$t('amount_min')" />
        <app-field class="flex-1" v-model="amountEnd" :label="$t('amount_max')" :placeholder="$t('amount_max')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { generateChildren } from '~/utils/VueUtils'
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

