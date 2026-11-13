<template>
  <div class="mx-row mx-tx static mxr-tx" :class="{ off: !transaction.isIncluded && !isCreated, ok: isCreated, err: !!transaction.error }">
    <div class="hd">
      <button
        type="button"
        class="mx-ck"
        :class="{ on: transaction.isIncluded || isCreated }"
        role="checkbox"
        :aria-checked="transaction.isIncluded || isCreated"
        :aria-label="`${$t('transaction.assistant_ramble_include')} ${description}`"
        :disabled="isCreated || isCreating"
        @click="emit('toggle', transaction)"
      >
        <app-icon :icon="IconCheck" :size="14" :stroke="3" />
      </button>
      <transaction-list-item-hero-icon :value="transaction.item" />
      <div class="m">
        <span class="mx-row__t wrap-anywhere">{{ description }}</span>
        <span v-if="displayedAccounts.length > 0" class="flow">
          <app-icon :icon="Account.getIcon(displayedAccounts[0]) ?? TablerIconConstants.account" :size="13" :stroke="2" />
          <span>{{ displayedAccounts.map((account) => Account.getDisplayName(account)).join(' → ') }}</span>
        </span>
      </div>
      <span class="r">
        <span class="mx-amt mx-money" :class="{ e: isTypeExpense, i: isTypeIncome, t: isTypeTransfer }">{{ transactionAmount }} {{ transactionCurrency }}</span>
        <span class="mx-date">{{ dateOrTimeAgo }}</span>
      </span>
    </div>

    <div v-if="categories.length > 0 || tags.some(Boolean)" class="tray">
      <div class="mx-chips">
        <span v-for="category in categories" :key="category.id" class="mx-chip">
          <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="12" :stroke="2" />
          <span>{{ Category.getDisplayName(category) }}</span>
        </span>
        <span v-for="tag in tags.filter(Boolean)" :key="tag.id" class="mx-chip">
          <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="12" :stroke="2" />
          <span>{{ Tag.getDisplayNameEllipsized(tag, 20) }}</span>
        </span>
      </div>
    </div>

    <span v-if="transaction.error" class="nt err">
      <app-icon :icon="IconAlertTriangle" :size="13" :stroke="2" />
      <span class="wrap-anywhere">{{ transaction.error }}</span>
    </span>

    <div class="acts">
      <span v-if="isCreating" class="mx-spin" />
      <template v-else-if="!isCreated">
        <button type="button" class="mx-btn xs out" @click="emit('edit', transaction)">
          <app-icon :icon="IconPencil" :size="16" :stroke="2" />
          <span>{{ $t('todo_page.edit') }}</span>
        </button>
        <button type="button" class="mx-btn xs ghost" @click="emit('delete', transaction)">
          <app-icon :icon="IconTrash" :size="16" :stroke="2" />
          <span>{{ $t('piggy_bank_page.remove') }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { IconAlertTriangle, IconCheck, IconPencil, IconTrash } from '@tabler/icons-vue'
import Account from '~/core/models/Account.js'
import Category from '~/core/models/Category.js'
import Tag from '~/core/models/Tag.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { rambleStatus } from '~/core/composables/useRamble'
import { useTransactionListItem } from '~/core/composables/useTransactionListItem.js'

// One interpreted draft in the ramble preview: include checkbox, the transaction row, its create status, Edit / Remove (design: MX-Ramble, Preview card).
const props = defineProps({ transaction: { type: Object, required: true } })
const emit = defineEmits(['toggle', 'edit', 'delete'])

const { isTypeExpense, isTypeIncome, isTypeTransfer, displayedAccounts, description, categories, tags, transactionAmount, transactionCurrency, dateOrTimeAgo } = useTransactionListItem(
  reactive({ value: computed(() => props.transaction.item) }),
)

const isCreating = computed(() => props.transaction.status === rambleStatus.creating)
const isCreated = computed(() => props.transaction.status === rambleStatus.success)
</script>
