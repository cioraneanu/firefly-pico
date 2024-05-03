<template>

  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="display-flex transaction-card prevent-select align-items-lg-stretch">

          <!--          <div class="first_column flex-center flex-column">-->
          <!--            <app-icon :icon="TablerIconConstants.transactionTemplate"/>-->
          <!--          </div>-->

          <!--          <div class="separator"></div>-->

          <div class="second_column flex-1">


            <div class="flex-center-vertical gap-2">
              <app-icon :icon="TablerIconConstants.transactionTemplate" :size="24"/>

              <div>
                <div v-if="name" class="list-item-title" style="line-height: 18px !important;">{{ name }}</div>
                <div class="text-size-12 font-weight-400 text-muted" style="line-height: 18px !important;"> {{ extraNames }}</div>
              </div>
              <!--              <div v-if="extraNames" class="text-size-12 font-weight-400 text-muted">( {{ extraNames }} )</div>-->
            </div>


            <!--            <div v-if="extraNames" class="flex-center-vertical gap-2">-->
            <!--              <div class="ml-20 text-size-12 font-weight-400 text-muted"> {{ extraNames }}</div>-->
            <!--            </div>-->


            <div v-if="displayedAccountNames.length > 0" class="flex-column">
              <div v-for="displayedAccount in displayedAccountNames" class="list-item-subtitle">
                <app-icon :icon="TablerIconConstants.account" :size="20"/>
                <span>{{ displayedAccount }}</span>
              </div>
            </div>

            <div v-if="description" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.description" :size="20"/>
              {{ category }}
            </div>

            <div v-if="category" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.category" :size="20"/>
              {{ category }}
            </div>

            <div v-if="notes" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.notes" :size="20"/>
              {{ notes }}
            </div>

            <div v-if="tags" class="tags-container">
              <div v-for="tag in visibleTags" class="tag">
                <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14"/>
                <div class="list-item-subtitle ml-5">{{ Tag.getDisplayName(tag, 10) }}</div>
              </div>
            </div>


          </div>

          <div class="third_column">
            <div v-show="transactionAmount > 0" class="font-weight-700 text-size-14">
              {{ transactionAmount }} {{ transactionCurrency }}
            </div>
          </div>


        </div>
      </template>

    </van-cell>


    <template #right>
      <van-button
          @click="onDelete"
          class="delete-button" square type="danger" text="Delete"/>
    </template>
  </van-swipe-cell>


</template>


<script setup>
import _, { get, isEqual } from 'lodash'

import Transaction from '~/models/Transaction'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '~/models/Tag.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const transactionType = computed(() => _.get(props.value, 'type'))

const name = computed(() => _.get(props.value, 'name', ' - '))
const extraNames = computed(() => get(props.value, 'extra_names', []).map(item => item.value).join(', ').slice(0, 50))
const description = computed(() => _.get(props.value, 'description', ' - '))
const notes = computed(() => _.get(props.value, 'notes', ' - '))

const category = computed(() => _.get(props.value, 'category.attributes.name'))
const tags = computed(() => get(props.value, 'tags', []))
const visibleTags = computed(() => {
  return tags.value.slice(0, 4)
})

const transactionAmount = computed(() => get(props.value, 'amount'))
const transactionCurrency = computed(() => _.get(props.value, 'currency_symbol'))

// const transactionCurrency = computed(() => _.get(firstTransaction.value, 'currency_symbol', ' - '))

// const isTypeExpense = computed(() => transactionType.value === Transaction.types.TYPE_EXPENSE)
// const isTypeIncome = computed(() => transactionType.value === Transaction.types.TYPE_INCOME)
// const isTypeTransfer = computed(() => transactionType.value === Transaction.types.TYPE_TRANSFER)

const isTypeExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(transactionType.value, Transaction.types.transfer))

const sourceAccountName = computed(() => _.get(props.value, 'account_source.attributes.name'))
const destinationAccountName = computed(() => _.get(props.value, 'account_destination.attributes.name'))

const displayedAccountNames = computed(() => {
  if (isTypeExpense.value) {
    return [destinationAccountName.value].filter(item => !!item)
  }
  if (isTypeIncome.value) {
    return [sourceAccountName.value].filter(item => !!item)
  }
  return [sourceAccountName.value, destinationAccountName.value].filter(item => !!item)
})

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })


</script>

