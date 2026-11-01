<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="name" name="Name" :label="$t('name')" :rules="[rule.required()]" />

        <app-field v-model="code" name="Code" :label="$t('code')" :rules="[rule.required()]" />

        <app-field v-model="symbol" name="Symbol" :label="$t('symbol')" :rules="[rule.required()]" />

        <app-field v-model="decimal_places" name="Decimal places" :label="$t('currency_page.decimal_places')" :rules="[rule.required()]" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-2.5" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import _ from 'lodash-es'
import { startOfDay } from 'date-fns'
import UIUtils from '~/core/utils/UIUtils'
import DateUtils from '~/core/utils/DateUtils'
import { useProfileStore } from '~/core/stores/profileStore'
import { ref } from 'vue'
import AccountRepository from '~/core/repository/AccountRepository'
import { useForm } from '~/core/composables/useForm'
import AccountTransformer from '~/core/transformers/AccountTransformer'
import Account from '~/core/models/Account'
import { generateChildren } from '~/core/utils/VueUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import CurrencyTransformer from '~/core/transformers/CurrencyTransformer'
import Currency from '~/core/models/Currency'
import { rule } from '~/core/utils/ValidationUtils.js'

const currencyStore = useCurrencyStore()
const profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const currencyStore = useCurrencyStore()
  item.value = currencyStore.currencyDictionary[useRoute().params.id]
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = CurrencyTransformer.transformFromApi(newItem)
    currencyStore.currenciesList = [newItem, ...currencyStore.currenciesList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    currencyStore.currenciesList = currencyStore.currenciesList.filter((item) => item.id !== itemId.value)
  }
}

const { itemId, item, saveItem, onDelete, onNew, onValidationError } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_CURRENCY_LIST,
  routeForm: RouteConstants.ROUTE_CURRENCY_ID,
  model: new Currency(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { name, code, symbol, decimal_places, isEnabled, isDefault } = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'code', parentKey: 'attributes.code' },
  { computed: 'symbol', parentKey: 'attributes.symbol' },
  { computed: 'decimal_places', parentKey: 'attributes.decimal_places' },
  { computed: 'isEnabled', parentKey: 'attributes.enabled' },
  { computed: 'isDefault', parentKey: 'attributes.default' },
])

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('currency_page.title_edit') : t('currency_page.title_add'),
  backRoute: RouteConstants.ROUTE_CURRENCY_LIST,
})
</script>
