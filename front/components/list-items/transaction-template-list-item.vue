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
              <app-icon :icon="TablerIconConstants.transactionTemplate" :size="24" />

              <div>
                <div class="flex-center-vertical gap-1">
                  <transaction-type-dot :transactionType="transactionType" />
                  <div v-if="name" class="list-item-title" style="line-height: 18px !important">{{ name }}</div>
                </div>

                <div class="text-size-12 font-weight-400 text-muted" style="line-height: 18px !important">{{ extraNames }}</div>
              </div>
              <!--              <div v-if="extraNames" class="text-size-12 font-weight-400 text-muted">( {{ extraNames }} )</div>-->
            </div>

            <!--            <div v-if="extraNames" class="flex-center-vertical gap-2">-->
            <!--              <div class="ml-20 text-size-12 font-weight-400 text-muted"> {{ extraNames }}</div>-->
            <!--            </div>-->

            <div v-if="displayedAccounts.length > 0" class="flex-column">
              <div v-for="displayedAccount in displayedAccounts" class="list-item-subtitle">
                <app-icon :icon="Account.getIcon(displayedAccount) ?? TablerIconConstants.account" :size="20" />
                <span>{{ Account.getDisplayName(displayedAccount) }}</span>
              </div>
            </div>

            <div v-if="description" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.description" :size="20" />
              {{ description }}
            </div>

            <div v-if="category" class="list-item-subtitle">
              <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="20" />
              {{ Category.getDisplayName(category) }}
            </div>

            <div v-if="budget" class="list-item-subtitle">
              <app-icon :icon="Budget.getIcon(budget) ?? TablerIconConstants.budget" :size="20" />
              {{ Budget.getDisplayName(budget) }}
            </div>

            <div v-if="notes" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.notes" :size="20" />
              {{ notes }}
            </div>

            <div v-if="tags" class="tags-container">
              <div v-for="tag in visibleTags" class="tag">
                <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
                <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
              </div>
            </div>
          </div>

          <div class="third_column">
            <div v-show="transactionAmount > 0" class="font-weight-700 text-size-14">
              {{ transactionAmount }}
              {{ transactionCurrency }}
            </div>
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button @click="onDelete" class="delete-button" square type="danger" text="Delete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import _, { get } from 'lodash'

import Account from '~/models/Account'
import Category from '~/models/Category'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '~/models/Tag.js'
import Budget from '~/models/Budget.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const transactionType = computed(() => _.get(props.value, 'type'))

const name = computed(() => _.get(props.value, 'name', ' - '))
const extraNames = computed(() =>
  get(props.value, 'extra_names', [])
    .map((item) => item.value)
    .join(', ')
    .slice(0, 50),
)
const description = computed(() => _.get(props.value, 'description', ' - '))
const notes = computed(() => _.get(props.value, 'notes', ' - '))
const budget = computed(() => _.get(props.value, 'budget'))

const category = computed(() => _.get(props.value, 'category'))
const tags = computed(() => get(props.value, 'tags', []))
const visibleTags = computed(() => {
  return tags.value.slice(0, 4)
})

const transactionAmount = computed(() => get(props.value, 'amount'))
const transactionCurrency = computed(() => _.get(props.value, 'currency_symbol'))

const sourceAccount = computed(() => _.get(props.value, 'account_source'))
const destinationAccount = computed(() => _.get(props.value, 'account_destination'))

const displayedAccounts = computed(() => {
  return [sourceAccount.value, destinationAccount.value].filter((item) => !!item)
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
