<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'currency_page.title_edit' : 'currency_page.title_add')" @close="close">
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('code')" :rules="[rule.required()]" :value="form.code">
      <d-input v-model="form.code" class="max-w-50" />
    </d-field>
    <d-field :label="$t('symbol')" :rules="[rule.required()]" :value="form.symbol">
      <d-input v-model="form.symbol" class="max-w-50" />
    </d-field>
    <d-field :label="$t('currency_page.decimal_places')" :rules="[rule.required()]" :value="form.decimalPlaces">
      <d-input v-model="form.decimalPlaces" type="number" min="0" class="max-w-50" />
    </d-field>
    <div class="h-px bg-line" />
    <d-field :label="$t('active')">
      <d-switch v-model="form.isEnabled" />
    </d-field>
    <d-field :label="$t('desktop.default_currency')">
      <d-switch v-model="form.isDefault" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_CURRENCY_LIST)
const form = reactive(useCurrencyForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
