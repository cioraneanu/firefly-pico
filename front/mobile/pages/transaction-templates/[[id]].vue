<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <app-card>
          <transaction-type-tabs v-model="type" />

          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <div class="mx-f">
            <div class="mx-l">{{ $t('desktop.extra_names') }}</div>
            <app-repeater v-model="extra_names" :empty-item="{ value: '' }">
              <template #content="{ element, index }">
                <app-field v-model="element.value" :placeholder="$t('name')" :name="`extra-name-${index}`" />
              </template>
            </app-repeater>
            <div class="mx-d">{{ $t('desktop.extra_names_hint') }}</div>
          </div>

          <transaction-amount-field v-model:amount="amount" />

          <account-select v-model="account_source" :label="$t('transaction.source_account')" :allowed-types="accountSourceAllowedTypes" />

          <account-select v-model="account_destination" :label="$t('transaction.destination_account')" :allowed-types="accountDestinationAllowedTypes" />

          <app-field v-model="description" type="textarea" rows="2" autosize :label="$t('description')" />

          <category-select v-model="category" />

          <tag-select v-model="tags" />

          <budget-select v-model="budget" />

          <app-field v-model="notes" type="textarea" rows="2" autosize :label="$t('notes')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
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
  extra_names,
  amount,
  tags,
  description,
  notes,
  account_source,
  account_destination,
  category,
  type,
  budget,
  accountSourceAllowedTypes,
  accountDestinationAllowedTypes,
} = useTemplateForm()

const { t } = useI18n()
useToolbar().init({
  title: itemId.value ? t('transaction_template_page.title_edit') : t('transaction_template_page.title_add'),
  backRoute: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
})
</script>
