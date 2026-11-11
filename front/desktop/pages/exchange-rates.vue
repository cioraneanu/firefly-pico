<template>
  <d-page :title="$t('exchange_rates')" :description="$t('desktop.exchange_rates_description')">
    <template #actions>
      <d-refresh-button :action="currencyStore.fetchExchangeRate" />
    </template>

    <d-card :title="`${$t('date')}: ${currencyStore.exchangeRates?.date ?? '-'}`" :description="`${$t('exchange_rate_page.relative_to_usd')} · ${$t('exchange_rate_page.edit_hint')}`" flush>
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
          <tr v-for="rate in filtered" :key="rate.code" :class="rate.isEditable && 'cursor-pointer'" @click="rate.isEditable && open(rate)">
            <td>
              <span class="inline-grid h-6 min-w-11 place-items-center rounded-md bg-soft px-1.5 font-mono text-xs font-medium">{{ rate.code }}</span>
            </td>
            <td class="font-medium">{{ rate.name }}</td>
            <td class="text-dim">{{ rate.country }}</td>
            <td class="text-right font-mono text-[13px] tabular-nums">
              <d-badge v-if="rate.isCustom" class="mr-2 font-sans">{{ $t('exchange_rate_page.custom') }}</d-badge>
              <span :class="rate.isCustom && 'font-semibold'">{{ rate.value }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <d-empty v-else :icon="IconSearch" class="border-t border-line" />
    </d-card>

    <d-dialog :open="isOpen" :title="editedRate?.code" :description="editedRate?.name" size="sm" @close="isOpen = false">
      <d-form @submit="save">
        <d-field :label="$t('exchange_rate_page.per_usd', { code: editedRate?.code })" :hint="$t('exchange_rate_page.fetched_rate', { value: editedRate?.fetchedValue ?? '-' })">
          <d-input v-model="editedValue" type="number" step="any" min="0" class="font-mono" autofocus />
        </d-field>
      </d-form>
      <template #footer>
        <d-button v-if="editedRate?.isCustom" :icon="IconArrowBackUp" class="mr-auto" @click="reset">{{ $t('exchange_rate_page.use_fetched') }}</d-button>
        <d-button @click="isOpen = false">{{ $t('cancel') }}</d-button>
        <d-button variant="primary" :disabled="!isValid" @click="save">{{ $t('save') }}</d-button>
      </template>
    </d-dialog>
  </d-page>
</template>

<script setup>
import { IconArrowBackUp, IconSearch } from '@tabler/icons-vue'

const currencyStore = useCurrencyStore()
const { rate: editedRate, value: editedValue, isOpen, isValid, open, save, reset } = useExchangeRateForm()
const { search, filtered } = useSearch(
  () => currencyStore.exchangeRatesList,
  (rate) => rate.code,
  (rate) => rate.name,
  (rate) => rate.country,
)
</script>
