<template>
  <d-sheet v-model:open="open" :title="$t('filters.transaction_filters')">
    <d-form class="gap-4 [--label-w:6.5rem]">
      <d-field :label="$t('description')">
        <d-input v-model="draft.description" clearable />
      </d-field>
      <d-field :label="$t('transaction_type')">
        <d-enum-select v-model="draft.transactionType" :options="Transaction.typesList" clearable />
      </d-field>
      <d-field :label="$t('date_after')">
        <d-date v-model="draft.dateStart" clearable />
      </d-field>
      <d-field :label="$t('date_before')">
        <d-date v-model="draft.dateEnd" clearable />
      </d-field>
      <div class="flex">
        <d-button size="sm" :icon="IconChevronLeft" class="flex-1 rounded-r-none" @click="shiftMonth(-1)">{{ $t('sub_month') }}</d-button>
        <d-button size="sm" class="flex-1 rounded-none border-x-0" @click="shiftMonth(0)">{{ $t('this_month') }}</d-button>
        <d-button size="sm" class="flex-1 rounded-l-none" @click="shiftMonth(1)">{{ $t('add_month') }}</d-button>
      </div>
      <d-field :label="$t('amount_min')">
        <d-input v-model="draft.amountStart" type="number" step="any" />
      </d-field>
      <d-field :label="$t('amount_max')">
        <d-input v-model="draft.amountEnd" type="number" step="any" />
      </d-field>
      <d-field :label="$t('accounts')">
        <d-account-select v-model="draft.account" multiple clearable />
      </d-field>
      <d-field :label="$t('category')">
        <div class="flex flex-col gap-1">
          <d-category-select v-model="draft.category" />
          <d-checkbox v-model="draft.withoutCategory">{{ $t('without') }}</d-checkbox>
        </div>
      </d-field>
      <d-field :label="$t('tag')">
        <div class="flex flex-col gap-1">
          <d-tag-select v-model="draft.tag" />
          <d-checkbox v-model="draft.withoutTag">{{ $t('without') }}</d-checkbox>
        </div>
      </d-field>
      <d-field :label="$t('budget')">
        <div class="flex flex-col gap-1">
          <d-budget-select v-model="draft.budget" />
          <d-checkbox v-model="draft.withoutBudget">{{ $t('without') }}</d-checkbox>
        </div>
      </d-field>
    </d-form>
    <template #footer>
      <d-button variant="primary" @click="apply">{{ $t('filters.apply_filters') }}</d-button>
      <d-button @click="draft = {}">{{ $t('filters.clear') }}</d-button>
    </template>
  </d-sheet>
</template>

<script setup>
import { IconChevronLeft } from '@tabler/icons-vue'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import { cloneDeep } from 'lodash-es'
import Transaction from '~/core/models/Transaction'

const model = defineModel()
const open = defineModel('open')
const draft = ref({})

watch(open, (value) => value && (draft.value = cloneDeep(model.value)))

const shiftMonth = (offset) => {
  const month = offset ? addMonths(draft.value.dateStart ?? startOfMonth(new Date()), offset) : new Date()
  draft.value = { ...draft.value, dateStart: startOfMonth(month), dateEnd: endOfMonth(month) }
}

const apply = () => {
  model.value = draft.value
  open.value = false
}
</script>
