<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-2.5" />

    <transaction-assistant v-if="!itemId && !isCloning" v-model="assistantText" @change="onAssistant" @keyup.enter="saveItem" />

    <transaction-form ref="transactionFormRef" v-model="item" :form-name="formName" @submit="saveItem" @failed="onValidationError">
      <template #actions>
        <div style="margin: 16px; position: relative">
          <app-button-form-delete v-if="itemId && !isSplitTransaction" class="mt-2.5" @click="onDelete" />

          <div class="flex gap-1">
            <van-button v-if="itemId && !isSplitTransaction" block type="default" class="mt-2 flex-1 cursor-pointer" @click="onCreateClone">
              <app-icon :icon="TablerIconConstants.clone" />
              {{ $t('clone') }}
            </van-button>

            <van-button v-if="itemId && !isSplitTransaction" block type="default" class="mt-2 flex-1 cursor-pointer" @click="onCreateTransactionTemplate">
              <app-icon :icon="TablerIconConstants.transactionTemplate" />
              {{ $t('transaction.make_template') }}
            </van-button>
          </div>
        </div>

        <app-button-form-save v-if="!isSplitTransaction" />
      </template>
    </transaction-form>

    <app-card-info v-if="!isSplitTransaction" style="order: 99">
      <app-field-link :label="$t('transaction.configure_fields')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
    </app-card-info>
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

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName, isCloning, isSplitTransaction, cloneRoute, templateRoute, title } = useTransactionEditor({
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

onMounted(animateTransactionForm)
</script>
