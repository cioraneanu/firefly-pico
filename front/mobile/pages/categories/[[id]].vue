<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-card-info v-if="itemId">
      <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
    </app-card-info>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="name" name="name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />
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

const { itemId, saveItem, onDelete, onNew, onValidationError, formName, name, icon, transactionsRoute } = useCategoryForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: itemId.value ? t('category_page.title_edit') : t('category_page.title_add'),
  backRoute: RouteConstants.ROUTE_CATEGORY_LIST,
})
</script>
