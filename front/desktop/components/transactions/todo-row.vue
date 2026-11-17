<template>
  <div
    role="row"
    :class="[
      'grid min-h-14 grid-cols-[1.25rem_2.5rem_minmax(11rem,1fr)_minmax(13rem,1.1fr)_minmax(13rem,1.25fr)_7rem_auto] items-center gap-3 py-2 pl-4 pr-3 transition-colors hover:bg-soft/60',
      selected && 'bg-primary/6',
    ]"
  >
    <d-checkbox v-model="selected" :aria-label="description" />
    <span class="relative w-max">
      <d-tile :icon="icon" />
      <span :class="['absolute -bottom-0.5 -right-0.5 z-1 size-2.5 rounded-full ring-2 ring-card', isTypeExpense ? 'bg-tx-expense' : isTypeIncome ? 'bg-tx-income' : 'bg-tx-transfer']" />
    </span>
    <div class="flex min-w-0 flex-col">
      <span class="flex min-w-0 items-center gap-1.5">
        <button type="button" class="cursor-pointer truncate text-left font-medium hover:underline" aria-haspopup="dialog" @click="emit('edit')">{{ description }}</button>
        <icon-paperclip v-if="hasAttachments" :size="13" class="shrink-0 text-dim" />
        <icon-calendar-repeat v-if="recurrence" :size="13" class="shrink-0 text-dim" />
      </span>
      <span v-if="rawNotes" class="truncate text-xs text-dim" :title="rawNotes">{{ rawNotes }}</span>
    </div>
    <span class="flex min-w-0 items-center gap-1.5">
      <d-chip v-if="displayedAccounts[0]" :icon="Account.getIcon(displayedAccounts[0]) ?? IconCreditCard">{{ Account.getDisplayName(displayedAccounts[0]) }}</d-chip>
      <icon-arrow-right v-if="displayedAccounts[1]" :size="13" class="shrink-0 text-dim" />
      <d-chip v-if="displayedAccounts[1]" :icon="Account.getIcon(displayedAccounts[1]) ?? IconCreditCard">{{ Account.getDisplayName(displayedAccounts[1]) }}</d-chip>
    </span>
    <span class="flex min-w-0 flex-wrap gap-1">
      <template v-for="chip in chips" :key="chip.key">
        <d-badge v-if="chip.isTodo" variant="warning">{{ chip.label }}</d-badge>
        <d-chip v-else :icon="chip.icon">{{ chip.label }}</d-chip>
      </template>
    </span>
    <span :class="['whitespace-nowrap text-right font-medium tabular-nums', isTypeIncome ? 'text-income' : isTypeTransfer ? 'text-dim' : '']">{{ transactionAmount }} {{ transactionCurrency }}</span>
    <span class="flex items-center justify-end gap-1">
      <d-button size="sm" :icon="IconPencil" aria-haspopup="dialog" @click="emit('edit')">{{ $t('todo_page.edit') }}</d-button>
      <d-button v-if="isDone" size="sm" :icon="IconArrowBackUp" @click="emit('putBack')">{{ $t('todo_page.put_back') }}</d-button>
      <d-button v-else size="sm" :icon="IconCheck" @click="emit('done')">{{ $t('todo_page.mark_done') }}</d-button>
    </span>
  </div>
</template>

<script setup>
import { IconArrowBackUp, IconArrowRight, IconCalendarRepeat, IconCheck, IconCoins, IconCreditCard, IconPaperclip, IconPencil } from '@tabler/icons-vue'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import { useTodoListItem } from '~/core/composables/useTodoListItem'

// TODO Inbox row (design: TodoInbox): the Transactions row with a checkbox, and Edit / Mark as done on the right
const props = defineProps({ value: Object, isDone: Boolean })
const selected = defineModel('selected', { type: Boolean, default: false })
const emit = defineEmits(['edit', 'done', 'putBack'])

const { isTypeExpense, isTypeIncome, isTypeTransfer, displayedAccounts, description, hasAttachments, categories, tags, transactionAmount, transactionCurrency, rawNotes, recurrence, chips } =
  useTodoListItem(props)

const icon = computed(() => Category.getIcon(categories.value[0]) ?? Tag.getIcon(tags.value.find((tag) => !tag?.attributes?.is_todo)) ?? IconCoins)
</script>
