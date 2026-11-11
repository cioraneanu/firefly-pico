<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" finished @refresh="onRefresh">
        <app-list-search v-model="search" :placeholder="$t('exchange_rate_page.search')" />

        <div class="mx-meta-row">
          <span class="mx-chip fill"
            ><app-icon :icon="IconCalendar" :size="12" :stroke="2" /><span>{{ $t('date') }}: {{ exchangeDate }}</span></span
          >
          <span class="mx-chip"
            ><app-icon :icon="IconCurrencyDollar" :size="12" :stroke="2" /><span>{{ $t('exchange_rate_page.relative_to_usd') }}</span></span
          >
        </div>

        <div v-if="filteredList.length > 0" class="mx-list">
          <div class="mx-rates">
            <div v-for="currency in filteredList" :key="currency.code" class="mx-rate">
              <b>{{ currency.code }}</b>
              <span>{{ currency.name }}</span>
              <i>{{ currency.value }}</i>
            </div>
          </div>
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else :icon="TablerIconConstants.exchangeRates" :hint="$t('exchange_rate_page.empty_hint')" />
      </app-list>
    </main>
  </div>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconCalendar, IconCurrencyDollar } from '@tabler/icons-vue'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

const currencyStore = useCurrencyStore()

const isRefreshing = ref(false)
const search = ref('')

const exchangeDate = computed(() => get(currencyStore.exchangeRates, 'date'))
const list = computed(() => currencyStore.exchangeRatesList)

const filteredList = computed(() => (search.value ? list.value.filter((item) => ['code', 'name', 'country'].some((key) => LanguageUtils.includesSearch(item[key], search.value))) : list.value))

const onRefresh = async () => {
  isRefreshing.value = true
  await currencyStore.fetchExchangeRate()
  isRefreshing.value = false
}

const { t } = useI18n()
useToolbar().init({
  title: t('exchange_rates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
