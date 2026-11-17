<template>
  <d-page :title="$t('piggy_banks')" :description="$t('desktop.piggy_banks_description')">
    <template #actions>
      <d-refresh-button :action="piggyBankStore.fetchPiggyBanks" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_PIGGY_BANK_ID">{{ $t('piggy_bank_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="piggyBank in filtered"
        :key="piggyBank.id"
        :title="PiggyBank.getDisplayName(piggyBank)"
        :icon="PiggyBank.getIcon(piggyBank) ?? IconPigMoney"
        :to="`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${piggyBank.id}`"
        :active="piggyBank.id === id"
      >
        <template #subtitle>
          <d-badge variant="outline" class="tabular-nums text-dim">{{ Math.round(PiggyBank.getPercent(piggyBank)) }}%</d-badge>
          <d-badge variant="outline" class="text-dim"><icon-building-bank :size="12" />{{ Account.getDisplayName(PiggyBank.getAccount(piggyBank)) }}</d-badge>
          <d-badge v-if="PiggyBank.getTargetDate(piggyBank)" variant="outline" class="tabular-nums text-dim"
            ><icon-calendar :size="12" />{{ DateUtils.dateToUI(PiggyBank.getTargetDate(piggyBank)) }}</d-badge
          >
          <span class="tabular-nums">{{ $t('piggy_bank_page.left_to_save') }}: {{ PiggyBank.getLeftToSave(piggyBank) }} {{ PiggyBank.getCurrencySymbol(piggyBank) }}</span>
        </template>
        <span class="flex w-60 shrink-0 flex-col gap-1.5">
          <span class="flex items-baseline gap-1.5 text-[13px] leading-[18px] tabular-nums">
            <b class="font-medium">{{ PiggyBank.getCurrentAmount(piggyBank) }} {{ PiggyBank.getCurrencySymbol(piggyBank) }}</b>
            <span class="whitespace-nowrap text-dim">/ {{ PiggyBank.getTargetAmount(piggyBank) }}</span>
          </span>
          <d-progress :value="PiggyBank.getPercent(piggyBank)" />
        </span>
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconPigMoney" />
    </d-list>

    <d-piggy-bank-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconBuildingBank, IconCalendar, IconPigMoney, IconPlus } from '@tabler/icons-vue'
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
