<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <template v-for="section in sections" :key="section.title">
        <template v-if="section.links.length > 0">
          <h2 class="mx-sec">
            <span>{{ section.title }}</span>
          </h2>
          <app-card-info>
            <app-field-link v-for="link in section.links" :key="link.route" :label="link.label" :icon="link.icon" @click="navigateTo(link.route)">
              <template v-if="link.count" #right>
                <span class="mx-row__v">{{ link.count }}</span>
              </template>
            </app-field-link>
          </app-card-info>
        </template>
      </template>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

const { t } = useI18n()
const profileStore = useProfileStore()
const accountStore = useAccountStore()
const templateStore = useTemplateStore()
const budgetStore = useBudgetStore()
const piggyBankStore = usePiggyBankStore()
const recurringTransactionStore = useRecurringTransactionStore()
const tagStore = useTagStore()
const categoryStore = useCategoryStore()
const currencyStore = useCurrencyStore()

// Feature toggles from the profile hide the links of disabled resources
const sections = computed(() => [
  {
    title: t('primary'),
    links: [
      { label: t('accounts'), icon: TablerIconConstants.account, route: RouteConstants.ROUTE_ACCOUNT_LIST, count: accountStore.accountList.length },
      { label: t('templates'), icon: TablerIconConstants.transactionTemplate, route: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST, count: templateStore.transactionTemplateList.length },
      profileStore.budgetsEnabled && { label: t('budgets'), icon: TablerIconConstants.budget, route: RouteConstants.ROUTE_BUDGET_LIST, count: budgetStore.budgetList.length },
      profileStore.piggyBanksEnabled && { label: t('piggy_banks'), icon: TablerIconConstants.piggyBank, route: RouteConstants.ROUTE_PIGGY_BANK_LIST, count: piggyBankStore.piggyBankList.length },
      profileStore.recurringTransactionsEnabled && {
        label: t('recurring_transactions'),
        icon: TablerIconConstants.recurringTransaction,
        route: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
        count: recurringTransactionStore.recurringTransactionList.length,
      },
    ].filter(Boolean),
  },
  {
    title: t('classification'),
    links: [
      profileStore.tagsEnabled && { label: t('tags'), icon: TablerIconConstants.tag, route: RouteConstants.ROUTE_TAG_LIST, count: tagStore.tagList.length },
      profileStore.categoriesEnabled && { label: t('categories'), icon: TablerIconConstants.category, route: RouteConstants.ROUTE_CATEGORY_LIST, count: categoryStore.categoryList.length },
    ].filter(Boolean),
  },
  {
    title: t('extra'),
    links: [
      { label: t('exchange_rates'), icon: TablerIconConstants.exchangeRates, route: RouteConstants.ROUTE_EXCHANGE_RATES },
      { label: t('currencies'), icon: TablerIconConstants.currency, route: RouteConstants.ROUTE_CURRENCY_LIST, count: currencyStore.currenciesList.length },
    ],
  },
])

useToolbar().init({ title: t('toolbar.extras') })

onMounted(() => {
  animateSettings()
})
</script>
