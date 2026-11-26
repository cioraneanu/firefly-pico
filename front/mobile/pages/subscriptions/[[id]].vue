<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <app-card-info v-if="itemId">
          <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
        </app-card-info>

        <app-card>
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <icon-select v-model="icon" />

          <div class="mx-2">
            <app-field v-model="amountMin" name="amountMin" type="number" :label="$t('subscription_page.amount_min')" :rules="[rule.required()]" required>
              <template #right>
                <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
              </template>
            </app-field>
            <app-field v-model="amountMax" name="amountMax" type="number" :label="$t('subscription_page.amount_max')" :rules="[rule.required(), amountMaxRule]" required>
              <template #right>
                <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
              </template>
            </app-field>
          </div>

          <currency-select v-model="currency" name="currency" />
        </app-card>

        <app-card>
          <app-date v-model="date" name="date" :label="$t('subscription_page.first_date')" :rules="[rule.required()]" required />

          <subscription-repeat-select v-model="repeatFreq" name="repeatFreq" :rules="[rule.required()]" required />

          <app-field v-model="skip" name="skip" type="number" inputmode="numeric" :label="$t('subscription_page.skip')" :description="$t('subscription_page.skip_description')" />

          <div class="mx-2">
            <app-date v-model="endDate" :label="$t('subscription_page.end_date')" />
            <app-date v-model="extensionDate" :label="$t('subscription_page.extension_date')" />
          </div>
          <div class="mx-d">{{ $t('subscription_page.extension_date_description') }}</div>

          <app-boolean v-model="active" :label="$t('subscription_page.active')" />
        </app-card>

        <app-card>
          <app-field v-model="notes" name="notes" type="textarea" rows="3" autosize :label="$t('notes')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Currency from '~/core/models/Currency'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { rule } from '~/core/utils/ValidationUtils.js'

const {
  itemId,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
  formName,
  name,
  icon,
  amountMin,
  amountMax,
  currency,
  date,
  repeatFreq,
  skip,
  endDate,
  extensionDate,
  active,
  notes,
  transactionsRoute,
  amountMaxRule,
} = useSubscriptionForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)
const currencySymbol = computed(() => Currency.getSymbol(currency.value))

const { t } = useI18n()
const route = useRoute()
useToolbar().init({
  title: computed(() => (itemId.value || route.params.id ? t('subscription_page.title_edit') : t('subscription_page.title_add'))),
  backRoute: RouteConstants.ROUTE_SUBSCRIPTION_LIST,
})
</script>
