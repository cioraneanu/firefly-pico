<template>
  <d-page :title="$t('exchange_rates')" :description="$t('desktop.exchange_rates_description')">
    <template #actions>
      <d-refresh-button :action="currencyStore.fetchExchangeRate" />
    </template>

    <d-card :title="`${$t('date')}: ${currencyStore.exchangeRates?.date ?? '-'}`" :description="$t('exchange_rate_page.relative_to_usd')" flush>
      <template #actions>
        <d-input v-model="search" :icon="IconSearch" :placeholder="$t('search_placeholder')" clearable class="w-70" />
      </template>
      <table v-if="filtered.length" class="d-table border-t border-line">
        <thead>
          <tr>
            <th>{{ $t('code') }}</th>
            <th>{{ $t('currency') }}</th>
            <th>{{ $t('desktop.country') }}</th>
            <th class="text-right">{{ $t('desktop.per_usd') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rate in filtered" :key="rate.code">
            <td>
              <span class="inline-grid h-6 min-w-11 place-items-center rounded-md bg-soft px-1.5 font-mono text-xs font-medium">{{ rate.code }}</span>
            </td>
            <td class="font-medium">{{ rate.name }}</td>
            <td class="text-dim">{{ rate.country }}</td>
            <td class="text-right font-mono text-[13px] tabular-nums">{{ rate.value }}</td>
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
