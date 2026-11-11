<template>
  <div class="mx-range mx-range--sticky dashboard-control-date">
    <button type="button" class="mx-ib out" :aria-label="$t('dash_page.previous_period')" @click.stop="onPreviousMonth">
      <app-icon :icon="IconChevronLeft" :size="18" :stroke="2" />
    </button>

    <div class="mid">
      <button type="button" class="pick" aria-haspopup="dialog" :aria-label="$t('dash_page.period')" @click="onOpenPeriod">
        <app-icon :icon="IconCalendarMonth" :size="15" :stroke="2" />
        <span>{{ rangeTitle }}</span>
      </button>
    </div>

    <button type="button" class="mx-btn sm out" aria-haspopup="dialog" :aria-label="$t('currency')" @click="showCurrencies = true">
      <app-icon :icon="IconCoins" :size="14" :stroke="2" />
      <span>{{ dashboardStore.dashboardCurrencyCode }}</span>
      <app-icon :icon="IconChevronDown" :size="14" :stroke="2" />
    </button>

    <button type="button" class="mx-ib out" :aria-label="$t('dash_page.next_period')" @click.stop="onNextMonth">
      <app-icon :icon="IconChevronRight" :size="18" :stroke="2" />
    </button>
  </div>

  <app-sheet v-model:show="showDropdown" :title="$t('dash_page.period')">
    <div class="mx-yr">
      <button type="button" class="mx-ib sm out" :aria-label="$t('dash_page.previous_year')" @click="pickedYear--">
        <app-icon :icon="IconChevronLeft" :size="16" :stroke="2" />
      </button>
      <b>{{ pickedYear }}</b>
      <button type="button" class="mx-ib sm out" :aria-label="$t('dash_page.next_year')" @click="pickedYear++">
        <app-icon :icon="IconChevronRight" :size="16" :stroke="2" />
      </button>
    </div>
    <div class="mx-mgrid" role="radiogroup">
      <button v-for="(name, index) in monthNames" :key="name" type="button" role="radio" :class="{ on: index === pickedMonth }" :aria-checked="index === pickedMonth" @click="pickedMonth = index">
        {{ name }}
      </button>
    </div>

    <template #footer>
      <button type="button" class="mx-btn out" @click="showDropdown = false">{{ $t('cancel') }}</button>
      <button type="button" class="mx-btn pri" @click="onSetMonth">{{ $t('done') }}</button>
    </template>
  </app-sheet>

  <app-sheet v-model:show="showCurrencies" :title="$t('currency_select.title')">
    <button v-for="currency in currencyList" :key="currency.id" type="button" class="mx-opt" :class="{ on: isCurrencySelected(currency) }" @click="onSelectCurrency(currency)">
      <span class="lb">{{ Currency.getCode(currency) }}</span>
      <span class="mt">{{ Currency.getName(currency) }}</span>
      <span class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
    </button>
  </app-sheet>
</template>

<script setup>
import { capitalize, get } from 'lodash-es'
import { format } from 'date-fns'
import { IconCalendarMonth, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconCoins } from '@tabler/icons-vue'
import Currency from '~/core/models/Currency.js'
import { useDashboardControls } from '~/core/composables/useDashboardControls.js'

import { useDashboardStore } from '~/core/stores/dashboardStore'
import { useCurrencyStore } from '~/core/stores/currencyStore'

const dashboardStore = useDashboardStore()
const currencyStore = useCurrencyStore()
const { showDropdown, rangeTitle, onNextMonth, onPreviousMonth, onChooseMonth } = useDashboardControls()

// ----- Period (month) picker
const monthNames = Array.from({ length: 12 }, (_, index) => capitalize(format(new Date(2000, index, 1), 'MMM')))
const pickedYear = ref(null)
const pickedMonth = ref(null)

const onOpenPeriod = () => {
  const month = dashboardStore.month ?? new Date()
  pickedYear.value = month.getFullYear()
  pickedMonth.value = month.getMonth()
  onChooseMonth()
}

const onSetMonth = () => {
  const month = dashboardStore.month
  if (!month || month.getFullYear() !== pickedYear.value || month.getMonth() !== pickedMonth.value) {
    dashboardStore.month = new Date(pickedYear.value, pickedMonth.value, 1)
  }
  showDropdown.value = false
}

// ----- Currency picker
const showCurrencies = ref(false)
const currencyList = computed(() => currencyStore.currenciesList.filter((item) => get(item, 'attributes.enabled')))
const isCurrencySelected = (currency) => get(currency, 'id') === get(dashboardStore.dashboardCurrency, 'id')

const onSelectCurrency = (currency) => {
  dashboardStore.dashboardCurrency = currency
  showCurrencies.value = false
}
</script>
