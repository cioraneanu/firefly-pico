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
          <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" />
          <icon-select v-model="icon" />
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
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const { itemId, saveItem, onDelete, onNew, onValidationError, formName, name, icon, transactionsRoute } = useCategoryForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const { t } = useI18n()
const route = useRoute()
useToolbar().init({
  title: computed(() => (itemId.value || route.params.id ? t('category_page.title_edit') : t('category_page.title_add'))),
  backRoute: RouteConstants.ROUTE_CATEGORY_LIST,
})
</script>
