<template>
  <div class="mx-row mx-tx td-row">
    <button type="button" class="td-open" aria-haspopup="dialog" @click="emit('edit')">
      <div class="hd">
        <transaction-list-item-hero-icon :value="value" />
        <div class="m">
          <span class="flex items-start gap-1">
            <span class="mx-row__t wrap min-w-0 wrap-anywhere">{{ description }}</span>
            <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="16" :stroke="2" class="mt-0.5 flex-none text-[var(--tr)]" />
          </span>
          <span v-if="displayedAccounts.length > 0" class="flow">
            <app-icon :icon="Account.getIcon(displayedAccounts[0]) ?? TablerIconConstants.account" :size="13" :stroke="2" />
            <span>{{ accountFlow }}</span>
          </span>
        </div>
        <span class="r">
          <span class="mx-amt mx-money" :class="amountClass">{{ transactionAmount }} {{ transactionCurrency }}</span>
          <span class="mx-date">{{ timeAgo }}</span>
        </span>
      </div>
    </button>

    <div v-if="chips.length > 0" class="tray">
      <div class="mx-chips">
        <transaction-split-badge v-if="isSplitPayment" />
        <span v-for="chip in getVisibleChips(isExpanded)" :key="chip.key" class="mx-chip">
          <app-icon :icon="chip.icon" :size="12" :stroke="2" />
          <span>{{ chip.label }}</span>
        </span>
        <span v-if="!isExpanded && chips.length > getVisibleChips(false).length" class="mx-chip more">
          <app-icon :icon="IconTags" :size="12" :stroke="2" />
          <span>+{{ chips.length - getVisibleChips(false).length }}</span>
        </span>
      </div>
    </div>

    <span v-if="rawNotes" class="nt">
      <app-icon :icon="IconBlockquote" :size="13" :stroke="2" />
      <span class="wrap-anywhere" :class="{ 'td-clamp': !isExpanded }">{{ rawNotes }}</span>
    </span>

    <dl v-if="isExpanded && canExpand" class="td-dl">
      <div v-for="detail in details" :key="detail.key" :class="{ miss: detail.isMissing }">
        <dt><app-icon :icon="detail.icon" :size="13" :stroke="2" />{{ detail.label }}</dt>
        <dd>{{ detail.value }}</dd>
      </div>
    </dl>

    <div class="td-acts">
      <button v-if="canExpand" type="button" class="mx-btn xs ghost" :aria-expanded="isExpanded" @click="isExpanded = !isExpanded">
        <app-icon :icon="isExpanded ? IconChevronUp : IconChevronDown" :size="14" :stroke="2" />
        <span>{{ $t(isExpanded ? 'todo_page.less' : 'todo_page.more') }}</span>
      </button>
      <span class="sp" />
      <button v-if="isDone" type="button" class="mx-btn xs out" @click="emit('putBack')">
        <app-icon :icon="IconArrowBackUp" :size="14" :stroke="2" />
        <span>{{ $t('todo_page.put_back') }}</span>
      </button>
      <button v-else type="button" class="mx-btn xs out" @click="emit('done')">
        <app-icon :icon="IconCheck" :size="14" :stroke="2" />
        <span>{{ $t('todo_page.mark_done') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { IconArrowBackUp, IconBlockquote, IconCheck, IconChevronDown, IconChevronUp, IconTags } from '@tabler/icons-vue'
import Account from '~/core/models/Account'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useTodoListItem } from '~/core/composables/useTodoListItem'

// TODO Inbox row (design: MX-TodoInbox): review a #todo transaction without opening it
const props = defineProps({
  value: Object,
  isDone: Boolean,
})
const isExpanded = defineModel('expanded', { type: Boolean, default: false })
const emit = defineEmits(['edit', 'done', 'putBack'])

const {
  isTypeExpense,
  isTypeIncome,
  isTypeTransfer,
  isSplitPayment,
  displayedAccounts,
  description,
  hasAttachments,
  transactionAmount,
  transactionCurrency,
  timeAgo,
  rawNotes,
  chips,
  details,
  canExpand,
  getVisibleChips,
} = useTodoListItem(props)

const accountFlow = computed(() => displayedAccounts.value.map((account) => Account.getDisplayName(account)).join(' → '))
const amountClass = computed(() => ({ e: isTypeExpense.value, i: isTypeIncome.value, t: isTypeTransfer.value }))
</script>
