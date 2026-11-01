<template>
  <d-page :title="$t('exchange_rates')" :description="$t('desktop.exchange_rates_description')">
    <template #actions>
      <d-refresh-button :action="currencyStore.fetchExchangeRate" />
    </template>

    <d-card :title="`${$t('date')}: ${currencyStore.exchangeRates?.date ?? '-'}`" :description="$t('exchange_rate_page.relative_to_usd')" flush>
      <template #actions>
        <d-input v-model="search" :icon="IconSearch" :placeholder="$t('search_placeholder')" clearable class="w-70" />
      </template>
      <table v-if="filtered.length" class="w-full border-t border-line text-sm">
        <thead class="text-left text-[13px] text-dim">
          <tr class="h-10 border-b border-line">
            <th class="px-4 font-normal">{{ $t('code') }}</th>
            <th class="px-4 font-normal">{{ $t('currency') }}</th>
            <th class="px-4 font-normal">{{ $t('desktop.country') }}</th>
            <th class="px-4 text-right font-normal">{{ $t('desktop.per_usd') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="rate in filtered" :key="rate.code" class="h-11 transition-colors hover:bg-soft/40">
            <td class="px-4">
              <span class="inline-grid h-6 min-w-11 place-items-center rounded-md bg-soft px-1.5 font-mono text-xs font-medium">{{ rate.code }}</span>
            </td>
            <td class="px-4 font-medium">{{ rate.name }}</td>
            <td class="px-4 text-dim">{{ rate.country }}</td>
            <td class="px-4 text-right font-mono text-[13px] tabular-nums">{{ rate.value }}</td>
          </tr>
        </tbody>
      </table>
      <d-empty v-else :icon="IconSearch" class="border-t border-line" />
    </d-card>
  </d-page>
</template>

<script setup>
import { IconSearch } from '@tabler/icons-vue'

const currencyStore = useCurrencyStore()
const { search, filtered } = useSearch(
  () => currencyStore.exchangeRatesList,
  (rate) => rate.code,
  (rate) => rate.name,
  (rate) => rate.country,
)
</script>
