<template>
  <van-popup v-model:show="showDropdown" round position="bottom" :style="style">
    <div class="h-100 display-flex flex-column qqq">
      <div class="flex-center-vertical m-10 mb-0">
        <div class="flex-1 text-center font-weight-600 text-size-18">{{ $t('filters.transaction_filters') }}</div>
      </div>

      <div ref="popupContentRef" class="flex-1 flex-column overflow-auto color" style="padding-bottom: 100px">
        <van-form @submit="onApplyFilters">
          <app-field class="flex-1" v-model="description" :label="$t('description')" :placeholder="$t('description')" />

          <transaction-type-select v-model="transactionType" />

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

          <div class="flex-center-vertical">
            <app-date class="flex-1" v-model="dateStart" :label="$t('date_after')" />
            <app-date class="flex-1" v-model="dateEnd" :label="$t('date_before')" />
          </div>

          <div class="px-3 flex-center-vertical gap-1">
            <van-button size="small" @click="onSubMonth">{{ $t('sub_month') }}</van-button>
            <van-button size="small" @click="onCurrentMonth">{{ $t('this_month') }}</van-button>
            <van-button size="small" @click="onAddMonth">{{ $t('add_month') }}</van-button>
          </div>

          <div class="display-flex">
            <app-field class="flex-1" v-model="amountStart" :label="$t('amount_min')" :placeholder="$t('amount_min')" />
            <app-field class="flex-1" v-model="amountEnd" :label="$t('amount_max')" :placeholder="$t('amount_max')" />
          </div>

          <app-button-form-save :label="$t('filters.apply_filters')" bottom=" - var(--van-tabbar-height) + 20px">
            <template #left>
              <van-button v-if="isFiltered" @click="onClearFilters" round>{{ $t('filters.clear') }}</van-button>
            </template>
          </app-button-form-save>
        </van-form>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'
import { generateChildren } from '~/utils/VueUtils'
import TagSelect from '~/components/select/tag-select.vue'
import { cloneDeep } from 'lodash'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'

const modelValue = defineModel({})

const localModelValue = ref({})
const { description, dateStart, dateEnd, amountStart, amountEnd, category, withoutCategory, tag, withoutTag, account, transactionType, withoutBudget, budget } = generateChildren(localModelValue, [
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
const showDropdown = ref(false)

const style = computed(() => {
  return {
    height: '95%',
    // 'height': 'calc(100vh - 3rem)',
    // 'height': '100%',
    'padding-top': '4px',
    'border-radius': '0px',
  }
})

watch(modelValue, (newValue) => {
  localModelValue.value = cloneDeep(newValue)
})

const show = () => {
  showDropdown.value = true
}

const onDismiss = () => {
  showDropdown.value = false
}

const onApplyFilters = () => {
  modelValue.value = localModelValue.value
  showDropdown.value = false
}

const isFiltered = computed(() => {
  return Object.values(localModelValue.value).some((item) => !!item)
})

const onClearFilters = () => {
  localModelValue.value = {}
}

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

const popupContentRef = ref(null)
useSwipeToDismiss({
  onSwipe: onDismiss,
  swipeRef: popupContentRef,
  showDropdown: showDropdown,
})

defineExpose({ show })
</script>
