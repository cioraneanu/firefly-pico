<template>

  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew"/>
      </template>
    </app-top-toolbar>

    <van-form
        ref="form"
        @submit="saveItem"
        @failed="onValidationError"
        class="">


      <van-cell-group inset>

        <app-field
            v-model="name"
            name="Name"
            label="Name"
            placeholder="Name"
            :rules="[{ required: true, message: 'Field is required' }]"
        />

        <app-field
            v-model="code"
            name="Code"
            label="Code"
            placeholder="Code"
            :rules="[{ required: true, message: 'Field is required' }]"
        />

        <app-field
            v-model="symbol"
            name="Symbol"
            label="Symbol"
            placeholder="Symbol"
            :rules="[{ required: true, message: 'Field is required' }]"
        />


      </van-cell-group>


      <div style="margin: 16px;">
        <app-button-form-save/>

        <app-button-form-delete
            class="mt-10"
            v-if="itemId"
            @click="onDelete"
        />

      </div>
    </van-form>

  </div>


</template>


import { ref } from 'vue';

<script setup>

import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _ from 'lodash'
import { startOfDay } from 'date-fns'
import UIUtils from '~/utils/UIUtils'
import DateUtils from '~/utils/DateUtils'
import { useAppStore } from '~/stores/appStore'
import { ref } from 'vue'
import AccountRepository from '~/repository/AccountRepository'
import { useForm } from '~/composables/useForm'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import { generateChildren } from '~/utils/VueUtils'
import { useToolbar } from '~/composables/useToolbar'
import CurrencyTransformer from '~/transformers/CurrencyTransformer'
import Currency from '~/models/Currency'

let dataStore = useDataStore()
let appStore = useAppStore()
const route = useRoute()

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const dataStore = useDataStore()
  item.value = dataStore.currencyDictionary[itemId.value]
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = CurrencyTransformer.transformFromApi(newItem)
    dataStore.currencyList = [newItem, ...dataStore.currencyList.filter(item => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    dataStore.currencyList = dataStore.currencyList.filter(item => item.id !== itemId.value)
  }
}

let {
  itemId, item, isEmpty, title, addButtonText,
  isLoading,
  onClickBack, saveItem, onDelete, onNew,
  onValidationError
} = useForm({
  form: form,
  titleAdd: 'Add currency',
  titleEdit: 'Edit currency',
  routeList: RouteConstants.ROUTE_CURRENCY_LIST,
  routeForm: RouteConstants.ROUTE_CURRENCY_ID,
  model: new Currency(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const {
  name, code, symbol, decimal_places, isEnabled, isDefault
} = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'code', parentKey: 'attributes.code' },
  { computed: 'symbol', parentKey: 'attributes.symbol' },
  { computed: 'decimal_places', parentKey: 'attributes.decimal_places' },
  { computed: 'isEnabled', parentKey: 'attributes.enabled' },
  { computed: 'isDefault', parentKey: 'attributes.default' },
])

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_CURRENCY_LIST,
})


</script>