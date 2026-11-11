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
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />

          <div class="mx-2">
            <app-field v-model="code" name="code" :label="$t('code')" :rules="[rule.required()]" required />
            <app-field v-model="symbol" name="symbol" :label="$t('symbol')" :rules="[rule.required()]" required />
          </div>

          <app-field v-model="decimalPlaces" name="decimalPlaces" type="digit" :label="$t('currency_page.decimal_places')" :rules="[rule.required()]" required />

          <div class="mx-hr" />
          <app-boolean v-model="isEnabled" :label="$t('active')" />
          <div class="mx-hr" />
          <app-boolean v-model="isDefault" :label="$t('desktop.default_currency')" />
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

const { itemId, saveItem, onDelete, onNew, onValidationError, formName, name, code, symbol, decimalPlaces, isEnabled, isDefault } = useCurrencyForm()

const { t } = useI18n()
useToolbar().init({
  title: itemId.value ? t('currency_page.title_edit') : t('currency_page.title_add'),
  backRoute: RouteConstants.ROUTE_CURRENCY_LIST,
})
</script>
