<template>
  <div class="-mt-2 flex flex-wrap items-center gap-2">
    <span v-for="filter in filters" :key="filter.bagKey" class="inline-flex h-7 max-w-full items-center rounded-full bg-soft/85 pl-2.5 pr-1 text-[12.8px] dark:bg-field/55">
      <app-icon :icon="icons[filter.bagKey] ?? IconFilter" :size="14" :stroke="2" class="mr-1.5 text-dim" />
      <span v-if="parts(filter).field" class="whitespace-nowrap text-dim">{{ parts(filter).field }}</span>
      <span class="ml-1 truncate font-semibold">{{ parts(filter).value }}</span>
      <button
        type="button"
        class="ml-1.5 grid size-5 shrink-0 cursor-pointer place-items-center rounded-full text-dim transition-colors hover:bg-fg/10 hover:text-fg"
        :aria-label="$t('filters.clear')"
        @click="emit('remove', filter.bagKey)"
      >
        <icon-x :size="13" />
      </button>
    </span>
    <d-button variant="ghost" size="sm" class="text-dim hover:text-fg" @click="emit('clear')">{{ $t('filters.clear') }}</d-button>
  </div>
</template>

<script setup>
import { IconBasket, IconCalendar, IconCategory, IconCoins, IconCreditCard, IconFilter, IconHash, IconRepeat, IconSearch, IconTag, IconX } from '@tabler/icons-vue'

defineProps({ filters: Array })
const emit = defineEmits(['remove', 'clear'])

const icons = {
  id: IconHash,
  description: IconSearch,
  transactionType: IconFilter,
  category: IconCategory,
  excludedCategory: IconCategory,
  withoutCategory: IconCategory,
  tag: IconTag,
  excludedTag: IconTag,
  withoutTag: IconTag,
  budget: IconBasket,
  withoutBudget: IconBasket,
  recurrence: IconRepeat,
  account: IconCreditCard,
  excludedAccount: IconCreditCard,
  dateStart: IconCalendar,
  dateEnd: IconCalendar,
  amountStart: IconCoins,
  amountEnd: IconCoins,
}

// "Field: value" reads as a muted field and a bold value
const parts = (filter) => {
  const [field, ...value] = String(filter.display).split(': ')
  return value.length ? { field, value: value.join(': ') } : { value: field }
}
</script>
