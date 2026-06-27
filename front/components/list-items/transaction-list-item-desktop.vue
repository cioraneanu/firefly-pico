<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <div class="list-item-container align-items-center cursor-pointer border-bottom p-2 gap-2" :class="cellClass">
      <div class="col-auto flex-center">
        <div class="icon-type" :class="typeClass" />
      </div>

      <div class="col-1 px-1 line-height-normal">
        <div class="text-size-13 font-weight-600">{{ dateFormatted }}</div>
        <div class="text-size-12 text-muted">{{ timeAgo }}</div>
      </div>

      <div class="col-3 px-1 overflow-hidden line-height-normal">
        <div class="flex-center-vertical gap-1">
          <span class="text-size-13 max-2-lines word-break-word">{{ description }}</span>
          <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="14" color="#1E88E5" />
        </div>
        <div v-if="notes" class="text-size-12 text-muted ellipse-text" v-html="notes" />
      </div>

      <div class="col-2 px-1 overflow-hidden">
        <div class="display-flex flex-wrap gap-1">
          <div v-for="account in displayedAccounts" :key="account.id" class="tag-gray list-item-subtitle text-size-12 overflow-hidden">
            <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="14" />
            <span class="ellipse-text">{{ Account.getDisplayName(account) }}</span>
          </div>
        </div>
      </div>

      <div class="col-2 px-1 overflow-hidden">
        <div v-if="profileStore.categoriesEnabled" class="display-flex flex-wrap gap-1">
          <div v-for="category in categories" :key="category.id" class="tag-gray list-item-subtitle text-size-12 overflow-hidden">
            <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="14" />
            <span class="ellipse-text">{{ Category.getDisplayName(category) }}</span>
          </div>
        </div>
      </div>

      <div class="col-1 px-1 overflow-hidden">
        <div v-if="profileStore.tagsEnabled" class="display-flex flex-wrap gap-1">
          <div v-for="tag in visibleTags" :key="tag.id" class="tag">
            <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
            <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
          </div>

          <div v-if="tags.length > visibleTags.length" class="text-size-12 text-muted ml-1">+{{ tags.length - visibleTags.length }}</div>
        </div>
      </div>

      <div class="col-1 px-1 overflow-hidden">
        <div v-if="profileStore.budgetsEnabled && budget" class="tag-gray list-item-subtitle text-size-12 overflow-hidden">
          <app-icon :icon="TablerIconConstants.budget" :size="14" />
          <span class="ellipse-text">{{ Budget.getDisplayName(budget) }}</span>
        </div>
      </div>

      <div class="col-1 px-1 text-right line-height-normal">
        <div class="text-size-13 font-weight-700" :style="amountStyle">{{ transactionAmount }} {{ transactionCurrency }}</div>
        <div v-if="isSplitPayment" class="text-size-10 font-weight-700 text-muted text-uppercase">{{ $t('split') }}</div>
      </div>

    </div>


    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Category from '~/models/Category.js'
import Tag from '~/models/Tag.js'
import { useTransactionListItem } from '~/composables/useTransactionListItem.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const {
  profileStore,
  isSplitPayment,
  displayedAccounts,
  description,
  hasAttachments,
  categories,
  notes,
  tags,
  budget,
  cellClass,
  typeClass,
  visibleTags,
  transactionAmount,
  transactionCurrency,
  dateFormatted,
  timeAgo,
  amountStyle,
} = useTransactionListItem(props)

const onEdit = () => {
  emit('onEdit', props.value)
}

const onDelete = () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
