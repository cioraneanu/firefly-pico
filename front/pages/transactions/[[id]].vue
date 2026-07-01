<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-10" />

    <transaction-assistant v-if="!itemId && !isCloning" v-model="assistantText" @change="onAssistant" @keyup.enter="saveItem" />

    <transaction-form ref="transactionFormRef" v-model="item" :form-name="formName" @submit="saveItem" @failed="onValidationError">
      <template #actions="{ isSplitTransaction }">
        <div style="margin: 16px; position: relative">
          <app-button-form-delete v-if="itemId && !isSplitTransaction" class="mt-10" @click="onDelete" />

          <div class="display-flex gap-1">
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

    <app-card-info style="order: 99">
      <app-field-link :label="$t('transaction.configure_fields')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
    </app-card-info>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'

import { get } from 'lodash-es'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import Transaction from '~/models/Transaction'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { animateTransactionForm } from '~/utils/AnimationUtils.js'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import { useI18n } from '#imports'
import TransactionForm from '~/components/transaction/TransactionForm.vue'

const route = useRoute()

const assistantText = ref('')
const transactionFormRef = ref(null)

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
  model: new Transaction(),
  resetFields: () => {
    assistantText.value = ''
  },
})

const onAssistant = async (assistantTransaction) => {
  await transactionFormRef.value?.applyAssistantTransaction(assistantTransaction)
}

const onCreateTransactionTemplate = async () => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}?transaction_id=${itemId.value}`)
}
const onCreateClone = async () => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}?transaction_id=${itemId.value}`)
}

const isCloning = computed(() => !!get(route.query, 'transaction_id'))

const { t } = useI18n()
const title = computed(() => {
  return isCloning.value ? t('transaction.title_clone_transaction') : itemId.value ? t('transaction.title_edit_transaction') : t('transaction.title_add_transaction')
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
  backRoute: RouteConstants.ROUTE_TRANSACTION_LIST,
})

onMounted(async () => {
  animateTransactionForm()
  cloneTransactions()
})

const cloneTransactions = async () => {
  const cloneId = get(route.query, 'transaction_id')
  if (!cloneId) {
    return
  }

  let cloneItem = await new TransactionRepository().getOne(cloneId)
  cloneItem = TransactionTransformer.transformFromApi(cloneItem.data)

  delete cloneItem.id
  item.value = cloneItem
}
</script>
