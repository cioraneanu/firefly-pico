<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'transaction_template_page.title_edit' : 'transaction_template_page.title_add')" @close="close">
    <d-type-pills v-model="form.type" />
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('desktop.extra_names')" :hint="$t('desktop.extra_names_hint')" top>
      <d-list-input v-model="form.extra_names" />
    </d-field>
    <d-field :label="$t('amount')">
      <d-input v-model="form.amount" type="number" step="0.01" class="max-w-50" />
    </d-field>
    <d-field :label="$t('transaction.source_account')">
      <d-account-select v-model="form.account_source" :allowed-types="form.accountSourceAllowedTypes" clearable />
    </d-field>
    <d-field :label="$t('transaction.destination_account')">
      <d-account-select v-model="form.account_destination" :allowed-types="form.accountDestinationAllowedTypes" clearable />
    </d-field>
    <d-field :label="$t('description')">
      <d-input v-model="form.description" />
    </d-field>
    <d-field :label="$t('category')">
      <d-category-select v-model="form.category" />
    </d-field>
    <d-field :label="$t('tags')">
      <d-tag-select v-model="form.tags" multiple />
    </d-field>
    <d-field :label="$t('budget')">
      <d-budget-select v-model="form.budget" />
    </d-field>
    <d-field :label="$t('notes')" top>
      <d-textarea v-model="form.notes" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)
const form = reactive(useTemplateForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
