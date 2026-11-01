<template>
  <section class="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 ring-1 ring-fg/10">
    <div class="flex min-w-0 flex-col gap-0.5">
      <h3 class="truncate text-base font-semibold">{{ transaction.attributes.group_title || Transaction.getDescription(transaction) }}</h3>
      <p class="text-[13px] tabular-nums text-dim">{{ DateUtils.dateToUIWithTime(Transaction.getDate(transaction)) }} · {{ $t('transaction.split_count', { count: splits.length }) }}</p>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-[13px] text-dim">{{ $t('transaction.total_amount') }}</span>
      <b v-for="total in Transaction.getSplitTotals(transaction)" :key="total.currencyCode" class="text-xl font-semibold tabular-nums">{{ total.amount }} {{ total.currencySymbol }}</b>
    </div>
  </section>
  <section v-for="(split, index) in splits" :key="index" class="rounded-xl bg-card ring-1 ring-fg/10">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div class="flex min-w-0 flex-col">
        <span class="text-xs tabular-nums text-dim">{{ index + 1 }} / {{ splits.length }}</span>
        <h4 class="truncate text-[15px] font-semibold">{{ split.description }}</h4>
      </div>
      <d-amount :value="split.amount" :currency="split.currency_symbol" :type="split.type" />
    </div>
    <dl class="flex flex-col gap-2.5 px-4 py-3.5 text-sm [--label-w:7rem]">
      <d-field :label="$t('accounts')">
        <span class="flex flex-wrap items-center gap-1.5">
          <d-chip :icon="IconCreditCard">{{ Account.getDisplayName(split.accountSource) }}</d-chip>
          <icon-arrow-right :size="13" class="text-dim" />
          <d-chip :icon="IconCreditCard">{{ Account.getDisplayName(split.accountDestination) }}</d-chip>
        </span>
      </d-field>
      <d-field v-if="split.category || split.tags?.length || split.budget" :label="$t('classifications')">
        <span class="flex flex-wrap gap-1">
          <d-chip v-if="split.category" :icon="Category.getIcon(split.category) ?? IconCategory">{{ Category.getDisplayName(split.category) }}</d-chip>
          <d-chip v-for="tag in split.tags?.filter(Boolean)" :key="tag.id" :icon="Tag.getIcon(tag) ?? IconTag">{{ Tag.getDisplayName(tag) }}</d-chip>
          <d-chip v-if="split.budget" :icon="IconBasket">{{ Budget.getDisplayName(split.budget) }}</d-chip>
        </span>
      </d-field>
      <d-field v-if="split.notes" :label="$t('notes')">
        <span class="text-dim">{{ split.notes }}</span>
      </d-field>
    </dl>
  </section>
</template>

<script setup>
import { IconArrowRight, IconBasket, IconCategory, IconCreditCard, IconTag } from '@tabler/icons-vue'
import Account from '~/core/models/Account'
import Budget from '~/core/models/Budget'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'

const props = defineProps({ transaction: Object })
const splits = computed(() => Transaction.getSplits(props.transaction))
</script>
