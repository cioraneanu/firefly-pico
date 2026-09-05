<template>
  <div class="display-flex flex-column h-100">
    <div class="flex-1 flex-column overflow-auto p-3 gap-2">
      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('analytics.filters.exclude') }}</div>
          <app-checkbox v-model="categoryExclude" shape="square" />
        </div>
        <category-select v-model="categorySelected" :is-multi-select="true" class="flex-1" />
      </div>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('analytics.filters.exclude') }}</div>
          <app-checkbox v-model="tagExclude" shape="square" />
        </div>
        <tag-select v-model="tagSelected" :is-multi-select="true" :auto-select-parents="false" class="flex-1" />
      </div>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('analytics.filters.exclude') }}</div>
          <app-checkbox v-model="budgetExclude" shape="square" />
        </div>
        <budget-select v-model="budgetSelected" :is-multi-select="true" class="flex-1" />
      </div>

      <div class="display-flex van-cell-fake pl-3 align-items-baseline">
        <div class="display-flex flex-column gap-3 align-items-center">
          <div class="text-size-14">{{ $t('analytics.filters.exclude') }}</div>
          <app-checkbox v-model="accountExclude" shape="square" />
        </div>
        <account-select v-model="accountSelected" :is-multi-select="true" class="flex-1" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { generateChildren } from '~/utils/VueUtils'
import { analyticsFilterModes } from '~/utils/AnalyticsFilterUtils'

const modelValue = defineModel({})

const { categorySelected, categoryMode, tagSelected, tagMode, budgetSelected, budgetMode, accountSelected, accountMode } = generateChildren(modelValue, [
  'categorySelected',
  'categoryMode',
  'tagSelected',
  'tagMode',
  'budgetSelected',
  'budgetMode',
  'accountSelected',
  'accountMode',
])

// The checkbox flips a dimension's whole selected list from inclusion to exclusion — it's bound
// to a derived boolean, not the raw 'include'/'exclude' mode string.
function excludeComputed(modeRef) {
  return computed({
    get: () => modeRef.value === analyticsFilterModes.exclude,
    set: (value) => {
      modeRef.value = value ? analyticsFilterModes.exclude : analyticsFilterModes.include
    },
  })
}

const categoryExclude = excludeComputed(categoryMode)
const tagExclude = excludeComputed(tagMode)
const budgetExclude = excludeComputed(budgetMode)
const accountExclude = excludeComputed(accountMode)
</script>
