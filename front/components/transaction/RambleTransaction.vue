<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell-group inset class="no-margin">
      <div class="p-10">
        <div class="display-flex align-items-start gap-2">
          <div class="tag-gray text-size-12">{{ props.index + 1 }}</div>
          <div class="flex-1-w">
            <div class="display-flex flex-center-vertical gap-2 flex-wrap">
              <div class="font-600 text-size-14 word-break-word">{{ description }}</div>
              <van-loading v-if="isCreating" size="14" />
              <van-tag v-else-if="isCreated" type="success" size="medium">{{ $t('transaction.assistant_ramble_status_created') }}</van-tag>
              <van-tag v-else-if="isFailed" type="danger" size="medium">{{ $t('transaction.assistant_ramble_status_failed') }}</van-tag>
            </div>
            <div v-if="accountSummary" class="text-size-12 text-muted word-break-word">{{ accountSummary }}</div>
            <div v-if="transaction.error" class="text-size-12 text-danger word-break-word">{{ transaction.error }}</div>
          </div>
          <div class="font-600 text-size-14 text-nowrap">{{ formattedAmount }}</div>
        </div>

        <div class="display-flex flex-wrap gap-1 mt-10">
          <van-tag v-for="previewTag in previewTags" :key="`${transaction.id}-${previewTag.label}`" round size="medium" type="primary">
            <span>{{ previewTag.label }}</span>
            <span>|</span>
            <span>{{ previewTag.value }}</span>
          </van-tag>
        </div>
      </div>
    </van-cell-group>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" :disabled="isCreating" @mouseup.stop @click.stop="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Category from '~/models/Category.js'
import DateUtils from '~/utils/DateUtils.js'
import Tag from '~/models/Tag'
import TransactionTemplate from '~/models/TransactionTemplate.js'
import Currency from '~/models/Currency.js'
import Transaction from '~/models/Transaction.js'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import { ellipsizeText } from '~/utils/Utils.js'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['delete', 'edit'])
const transaction = defineModel({
  type: Object,
  required: true,
})

const { t } = useI18n()

const firstSplit = computed(() => Transaction.getFirstSplit(transaction.value.item) ?? {})
const assistantTransaction = computed(() => transaction.value.assistant ?? {})
const rawTransaction = computed(() => assistantTransaction.value.raw ?? {})
const isCreating = computed(() => transaction.value.status === 'creating')
const isCreated = computed(() => transaction.value.status === 'success')
const isFailed = computed(() => transaction.value.status === 'error')

const description = computed(() => {
  return firstSplit.value.description || assistantTransaction.value.description || '-'
})

const formattedAmount = computed(() => {
  const amount = firstSplit.value.amount || assistantTransaction.value.amount
  const currencyCode = Currency.getCode(firstSplit.value.currencyForeign) || assistantTransaction.value.currencyCode
  return [amount, currencyCode].filter(Boolean).join(' ')
})

const getAccountDisplayName = (account) => {
  return account ? Account.getDisplayName(account) : null
}

const accountSummary = computed(() => {
  const source = getAccountDisplayName(firstSplit.value.accountSource) ?? rawTransaction.value.sourceAccountName
  const destination = getAccountDisplayName(firstSplit.value.accountDestination) ?? rawTransaction.value.destinationAccountName

  if (source && destination) {
    return `${source} -> ${destination}`
  }

  return source ?? destination ?? null
})

const previewTags = computed(() => {
  return [
    {
      label: t('template'),
      value: assistantTransaction.value.transactionTemplate ? TransactionTemplate.getDisplayName(assistantTransaction.value.transactionTemplate) : rawTransaction.value.templateName,
    },
    {
      label: t('tag'),
      value: firstSplit.value.tags?.length > 0 ? firstSplit.value.tags.map((tag) => Tag.getDisplayNameEllipsized(tag)).join(', ') : rawTransaction.value.tagNames?.join(', '),
    },
    { label: t('category'), value: firstSplit.value.category ? Category.getDisplayName(firstSplit.value.category) : rawTransaction.value.categoryName },
    { label: t('budget'), value: firstSplit.value.budget ? Budget.getDisplayName(firstSplit.value.budget) : rawTransaction.value.budgetName },
    { label: t('account'), value: accountSummary.value },
    { label: t('date'), value: firstSplit.value.date ? DateUtils.dateToUIWithTime(firstSplit.value.date) : null },
    { label: t('notes'), value: firstSplit.value.notes ? ellipsizeText(firstSplit.value.notes, 24) : null },
  ].filter((previewTag) => !!previewTag.value)
})

const onDelete = () => {
  if (isCreating.value) {
    return
  }

  emit('delete', transaction.value)
}

const onEdit = () => {
  emit('edit', transaction.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
