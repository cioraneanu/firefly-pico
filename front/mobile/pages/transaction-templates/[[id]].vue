<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <transaction-type-tabs v-model="type" class="mx-4 mt-4 mb-2" />

    <!--    @submit="onSave"-->
    <van-form ref="form" :name="formName" class="transaction-form-group" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="name" :icon="TablerIconConstants.fieldText2" :label="$t('name')" name="name" required :rules="[rule.required()]" />

        <div class="van-cell-fake flex-col van-cell">
          <span>{{ $t('transaction_template_page.extra_names') }}</span>
          <app-repeater v-model="extra_names" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <app-field v-model="element.value" placeholder="Name" class="compact" :name="`extra-name-${index}`" />
            </template>
          </app-repeater>
        </div>

        <transaction-amount-field ref="refAmount" v-model:amount="amount" />

        <account-select v-model="account_source" :label="$t('transaction.source_account')" :allowed-types="accountSourceAllowedTypes" />

        <account-select v-model="account_destination" :label="$t('transaction.destination_account')" :allowed-types="accountDestinationAllowedTypes" />

        <app-field v-model="description" :label="$t('description')" :icon="TablerIconConstants.fieldText2" type="textarea" rows="1" autosize placeholder="Description" />

        <category-select v-model="category" />

        <tag-select v-model="tags" />

        <budget-select v-model="budget" />

        <app-field v-model="notes" :label="$t('notes')" type="textarea" :icon="TablerIconConstants.fieldText1" rows="1" autosize />
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
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const refAmount = ref(null)
const { t } = useI18n()

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

const toolbar = useToolbar()
toolbar.init({
  title: itemId.value ? t('transaction_template_page.title_edit') : t('transaction_template_page.title_add'),
  backRoute: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
})
</script>
