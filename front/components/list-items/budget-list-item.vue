<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center flex-column">
<!--            <app-icon :icon="icon ?? TablerIconConstants.budget" :size="TablerIconConstants.defaultSize" />-->
            <budget-icon :value="props.value" />
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1 flex-column">
            <div v-if="displayName" class="title flex-center-vertical">
              <div class="flex-1">{{ displayName }}</div>
              <div class="text-size-12">{{ budgetLimitSpent }} / {{ budgetAmount }}</div>
            </div>
            <bar-chart-item-horizontal :percent="budgetLimitPercent" class="p-0 mb-10" />
            <div class="display-flex flex-wrap gap-1">
              <div class="tag-gray list-item-subtitle text-size-12">{{ budgetType }}</div>
              <div v-if="budgetAmount" class="tag-gray list-item-subtitle text-size-12">{{ budgetPeriod }}</div>
            </div>
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import _, { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import BudgetIcon from '~/components/budget/budget-icon.vue'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const budgetLimit = computed(() => Budget.getLimit(props.value))

const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const budgetType = computed(() => get(props.value, 'attributes.auto_budget_type.name', ' - '))
const budgetPeriod = computed(() => get(props.value, 'attributes.auto_budget_period.name', ' - '))
const budgetAmount = computed(() => get(props.value, 'attributes.amount', ' - '))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))

const icon = computed(() => Budget.getIcon(props.value))

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>

<style></style>
