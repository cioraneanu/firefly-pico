<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form v-if="isReady" :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body" :class="{ 'has-save': !isSplitTransaction }">
        <!-- Enter in the assistant submits the form (implicit submission), as the old @keyup.enter did -->
        <transaction-assistant v-if="!itemId && !isCloning" v-model="assistantText" @change="onAssistant" />

        <transaction-form ref="transactionFormRef" v-model="item">
          <template #actions>
            <div v-if="itemId" class="mx-list">
              <app-field-link :label="$t('clone')" :icon="TablerIconConstants.clone" :is-link="false" @click="onCreateClone" />
              <app-field-link :label="$t('transaction.make_template')" :icon="TablerIconConstants.transactionTemplate" :is-link="false" @click="onCreateTransactionTemplate" />
            </div>

            <app-button-form-delete v-if="itemId" @click="onDelete" />

            <app-card-info>
              <app-field-link :label="$t('transaction.configure_fields')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
            </app-card-info>
          </template>
        </transaction-form>
      </main>

      <app-button-form-save v-if="!isSplitTransaction" />
    </app-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateTransactionForm } from '~/core/utils/AnimationUtils.js'
import TransactionForm from '~/mobile/components/transaction/TransactionForm.vue'

const assistantText = ref('')
const transactionFormRef = ref(null)

const { isReady, itemId, item, saveItem, onDelete, onNew, onValidationError, formName, isCloning, isSplitTransaction, cloneRoute, templateRoute, title } = useTransactionEditor({
  resetFields: () => (assistantText.value = ''),
})

const onAssistant = (assistantTransaction) => transactionFormRef.value?.applyAssistantTransaction(assistantTransaction)
const onCreateTransactionTemplate = () => navigateTo(templateRoute.value)
const onCreateClone = () => navigateTo(cloneRoute.value)

const toolbar = useToolbar()
toolbar.init({
  title,
  backRoute: RouteConstants.ROUTE_TRANSACTION_LIST,
})

onMounted(() => isReady.value && animateTransactionForm())
watch(isReady, animateTransactionForm)
</script>
