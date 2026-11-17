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
            <button v-for="currency in filteredList" :key="currency.code" type="button" class="mx-rate" :class="{ custom: currency.isCustom }" :disabled="!currency.isEditable" @click="open(currency)">
              <b>{{ currency.code }}</b>
              <span>{{ currency.name }}</span>
              <i>
                {{ currency.value }}
                <app-icon v-if="currency.isCustom" :icon="IconPencil" :size="12" :stroke="2" :aria-label="$t('exchange_rate_page.custom')" />
              </i>
            </button>
          </div>
        </div>
        <p v-if="filteredList.length > 0" class="mx-foot">{{ $t('exchange_rate_page.edit_hint') }}</p>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else :icon="TablerIconConstants.exchangeRates" :hint="$t('exchange_rate_page.empty_hint')" />
      </app-list>
    </main>

    <app-sheet v-model:show="isOpen" :title="rate?.code" :description="rate?.name">
      <form class="mx-form" @submit.prevent="save">
        <app-field
          v-model="value"
          type="number"
          inputmode="decimal"
          :label="$t('exchange_rate_page.per_usd', { code: rate?.code })"
          :description="$t('exchange_rate_page.fetched_rate', { value: rate?.fetchedValue ?? '-' })"
        />
      </form>
      <template #footer>
        <button v-if="rate?.isCustom" type="button" class="mx-btn out" @click="reset">
          <app-icon :icon="IconArrowBackUp" :size="16" :stroke="2" /><span>{{ $t('exchange_rate_page.use_fetched') }}</span>
        </button>
        <button type="button" class="mx-btn pri" :disabled="!isValid" @click="save">
          <app-icon :icon="IconCheck" :size="16" :stroke="2" /><span>{{ $t('save') }}</span>
        </button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconArrowBackUp, IconCalendar, IconCheck, IconCurrencyDollar, IconPencil } from '@tabler/icons-vue'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

const currencyStore = useCurrencyStore()

const { rate, value, isOpen, isValid, open, save, reset } = useExchangeRateForm()

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
