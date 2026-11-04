<template>
  <d-page :title="$t('piggy_banks')" :description="$t('desktop.piggy_banks_description')">
    <template #actions>
      <d-refresh-button :action="piggyBankStore.fetchPiggyBanks" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_PIGGY_BANK_ID">{{ $t('piggy_bank_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <div v-if="filtered.length" class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
      <nuxt-link
        v-for="piggyBank in filtered"
        :key="piggyBank.id"
        :to="`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${piggyBank.id}`"
        class="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-fg/10 transition-shadow hover:shadow-md"
      >
        <span class="flex items-center gap-3">
          <d-tile :icon="PiggyBank.getIcon(piggyBank) ?? IconPigMoney" size="lg" />
          <span class="flex min-w-0 flex-col">
            <b class="truncate font-medium">{{ PiggyBank.getDisplayName(piggyBank) }}</b>
            <span class="truncate text-[13px] text-dim">{{ Account.getDisplayName(PiggyBank.getAccount(piggyBank)) }}</span>
          </span>
        </span>
        <span class="flex items-end justify-between">
          <span class="text-xl font-semibold tabular-nums">{{ PiggyBank.getCurrentAmount(piggyBank) }} {{ PiggyBank.getCurrencySymbol(piggyBank) }}</span>
          <span class="text-[13px] tabular-nums text-dim">/ {{ PiggyBank.getTargetAmount(piggyBank) }}</span>
        </span>
        <d-progress :value="PiggyBank.getPercent(piggyBank)" />
        <span class="flex justify-between text-xs text-dim">
          <span>{{ $t('piggy_bank_page.left_to_save') }}: {{ PiggyBank.getLeftToSave(piggyBank) }} {{ PiggyBank.getCurrencySymbol(piggyBank) }}</span>
          <span v-if="PiggyBank.getTargetDate(piggyBank)">{{ DateUtils.dateToUI(PiggyBank.getTargetDate(piggyBank)) }}</span>
        </span>
      </nuxt-link>
    </div>
    <d-list v-else>
      <d-empty :icon="IconPigMoney" />
    </d-list>

    <d-piggy-bank-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconPigMoney, IconPlus } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import PiggyBank from '~/core/models/PiggyBank'

const piggyBankStore = usePiggyBankStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_PIGGY_BANK_LIST)
const { search, filtered } = useSearch(
  () => piggyBankStore.piggyBankList,
  (item) => PiggyBank.getDisplayName(item),
)
</script>
