<template>
  <d-card :title="$t('piggy_banks')">
    <div class="-mx-2 -my-0.5 flex flex-col">
      <nuxt-link
        v-for="bar in piggyBanks"
        :key="bar.piggyBank.id"
        :to="`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${bar.piggyBank.id}`"
        :title="`${Math.round(bar.percent)}%`"
        class="grid h-[34px] grid-cols-[minmax(112px,1fr)_minmax(40px,1.4fr)_auto] items-center gap-3 rounded-lg px-2 transition-colors hover:bg-soft/60"
      >
        <span class="flex min-w-0 items-center gap-2">
          <app-icon :icon="PiggyBank.getIcon(bar.piggyBank) ?? IconPigMoney" :size="14" :stroke="2" class="shrink-0 text-dim" />
          <span class="truncate">{{ bar.label }}</span>
        </span>
        <span class="h-2 overflow-hidden rounded-full bg-soft">
          <span class="block h-full rounded-full bg-fg transition-[width]" :style="{ width: `${Math.min(bar.percent, 100)}%` }" />
        </span>
        <span class="min-w-[72px] whitespace-nowrap text-right font-medium tabular-nums">{{ bar.value }} {{ PiggyBank.getCurrencySymbol(bar.piggyBank) }}</span>
      </nuxt-link>
    </div>
    <d-empty v-if="!piggyBanks.length" :icon="IconPigMoney" />
  </d-card>
</template>

<script setup>
import { IconPigMoney } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import PiggyBank from '~/core/models/PiggyBank'

const { piggyBanks } = useDashboardBars()
</script>
