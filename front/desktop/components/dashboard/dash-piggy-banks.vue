<template>
  <d-card :title="$t('piggy_banks')" flush>
    <div class="flex flex-col gap-0.5 px-2">
      <nuxt-link
        v-for="bar in piggyBanks"
        :key="bar.piggyBank.id"
        :to="`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${bar.piggyBank.id}`"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-soft/60"
      >
        <d-tile :icon="PiggyBank.getIcon(bar.piggyBank) ?? IconPigMoney" size="sm" />
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="flex items-center justify-between gap-2 text-[13px]">
            <span class="truncate">{{ bar.label }}</span>
            <span class="font-medium tabular-nums">{{ bar.value }} · {{ Math.round(bar.percent) }}%</span>
          </span>
          <d-progress :value="bar.percent" />
        </span>
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
