<template>
  <div :class="['flex items-start gap-3 px-4 py-3', isCreated && 'opacity-60']">
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-baseline gap-3">
        <button type="button" class="min-w-0 flex-1 cursor-pointer truncate text-left font-medium hover:underline" :disabled="disabled" @click="emit('edit')">{{ description }}</button>
        <span :class="['whitespace-nowrap font-medium tabular-nums', isTypeIncome ? 'text-income' : isTypeTransfer ? 'text-dim' : '']">{{ transactionAmount }} {{ transactionCurrency }}</span>
      </div>
      <span class="text-xs text-dim">{{ dateOrTimeAgo }}</span>
      <span class="flex flex-wrap items-center gap-1">
        <template v-for="(account, index) in displayedAccounts" :key="account.id">
          <icon-arrow-narrow-right v-if="index > 0" :size="13" class="text-dim" />
          <d-chip :icon="Account.getIcon(account) ?? TablerIconConstants.account">{{ Account.getDisplayName(account) }}</d-chip>
        </template>
        <d-chip v-for="category in categories" :key="category.id" :icon="Category.getIcon(category) ?? TablerIconConstants.category">{{ Category.getDisplayName(category) }}</d-chip>
        <d-chip v-for="tag in tags.filter(Boolean)" :key="tag.id" :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag">{{ Tag.getDisplayName(tag) }}</d-chip>
      </span>
      <span v-if="draft.error" class="text-xs text-danger">{{ draft.error }}</span>
    </div>
    <div class="flex items-center gap-0.5">
      <icon-loader-2 v-if="draft.status === rambleStatus.creating" :size="16" class="d-spin m-1.5 text-dim" />
      <icon-circle-check v-else-if="isCreated" :size="18" class="m-1.5 text-success" />
      <template v-if="!isCreated">
        <d-button variant="ghost" size="icon-sm" :icon="IconPencil" :disabled="disabled" :aria-label="$t('todo_page.edit')" @click="emit('edit')" />
        <d-button variant="ghost" size="icon-sm" :icon="IconTrash" :disabled="disabled" :aria-label="$t('piggy_bank_page.remove')" @click="emit('remove')" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { IconArrowNarrowRight, IconCircleCheck, IconLoader2, IconPencil, IconTrash } from '@tabler/icons-vue'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { rambleStatus } from '~/core/composables/useRamble'
import { useTransactionListItem } from '~/core/composables/useTransactionListItem.js'

// One interpreted draft on the "Check the drafts" step: description (opens the editor), amount, date, accounts, category, tags, create status.
const props = defineProps({ draft: { type: Object, required: true }, disabled: Boolean })
const emit = defineEmits(['edit', 'remove'])

const { isTypeIncome, isTypeTransfer, displayedAccounts, description, categories, tags, transactionAmount, transactionCurrency, dateOrTimeAgo } = useTransactionListItem(
  reactive({ value: computed(() => props.draft.item) }),
)

const isCreated = computed(() => props.draft.status === rambleStatus.success)
</script>
