<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center flex-column">
            <app-icon :icon="icon ?? TablerIconConstants.piggyBank" :size="TablerIconConstants.defaultSize" />
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1 flex-column">
            <div v-if="displayName" class="title flex-center-vertical">
              <div class="flex-1">{{ displayName }}</div>
              <div class="text-size-12">{{ currentAmount }} / {{ targetAmount }} {{ currencySymbol }}</div>
            </div>
            <div class="display-flex flex-wrap gap-1 mt-5">
              <div class="tag-gray list-item-subtitle text-size-12">{{ percent }} %</div>
              <div v-if="accountName" class="tag-gray list-item-subtitle text-size-12">{{ accountName }}</div>
              <div v-if="targetDate" class="tag-gray list-item-subtitle text-size-12">{{ targetDate }}</div>
              <div class="flex-1" />
              <bar-chart-item-horizontal :percent="percent" style="max-width: 90px" />
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
import { get } from 'lodash-es'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import PiggyBank from '~/models/PiggyBank.js'
import Account from '~/models/Account.js'
import DateUtils from '~/utils/DateUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const icon = computed(() => PiggyBank.getIcon(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const currentAmount = computed(() => PiggyBank.getCurrentAmount(props.value))
const targetAmount = computed(() => PiggyBank.getTargetAmount(props.value))
const percent = computed(() => PiggyBank.getPercent(props.value).toFixed(0))
const currencySymbol = computed(() => PiggyBank.getCurrencySymbol(props.value))
const accountName = computed(() => Account.getDisplayName(PiggyBank.getAccount(props.value)))
const targetDate = computed(() => DateUtils.dateToUI(PiggyBank.getTargetDate(props.value)))

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
