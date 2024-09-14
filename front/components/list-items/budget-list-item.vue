<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center flex-column">
            <app-icon :icon="icon ?? TablerIconConstants.budget" :size="TablerIconConstants.defaultSize" />
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1 flex-column">
            <div v-if="displayName" class="title">{{ displayName }}</div>
            <div class="display-flex flex-wrap gap-1">
              <div class="tag-gray list-item-subtitle">{{ budgetType }}</div>
              <div v-if="budgetAmount" class="tag-gray list-item-subtitle">{{ budgetPeriod }}</div>
              <div v-if="budgetAmount" class="tag-gray list-item-subtitle">{{ budgetAmount }}</div>
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
import _ from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const dataStore = useDataStore()

const displayName = computed(() => _.get(props.value, 'attributes.name', ' - '))
const budgetType = computed(() => _.get(props.value, 'attributes.auto_budget_type.name', ' - '))
const budgetPeriod = computed(() => _.get(props.value, 'attributes.auto_budget_period.name', ' - '))
const budgetAmount = computed(() => _.get(props.value, 'attributes.amount', ' - '))

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
