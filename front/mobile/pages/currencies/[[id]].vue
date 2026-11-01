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
import { useToolbar } from '~/mobile/composables/useToolbar'
import { rule } from '~/core/utils/ValidationUtils.js'

const { itemId, saveItem, onDelete, onNew, onValidationError, name, code, symbol, decimalPlaces: decimal_places } = useCurrencyForm()

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('currency_page.title_edit') : t('currency_page.title_add'),
  backRoute: RouteConstants.ROUTE_CURRENCY_LIST,
})
</script>
