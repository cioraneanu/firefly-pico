<template>
  <d-dialog open :title="editor.title" size="xl" @close="close">
    <template #actions>
      <d-badge v-if="editor.isSplitTransaction" variant="outline">{{ $t('transaction.split_short') }}</d-badge>
      <d-button
        variant="ghost"
        size="icon-sm"
        :icon="IconAdjustmentsHorizontal"
        class="text-dim"
        :to="RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS"
        :title="$t('transaction.configure_fields')"
      />
    </template>

    <template v-if="!editor.itemId && !editor.isCloning">
      <d-assistant-input v-model="assistantText" @change="(change) => fields?.applyAssistantTransaction(change)" />
      <div class="h-px bg-line" />
    </template>

    <d-split-view v-if="editor.isSplitTransaction" :transaction="editor.item" />
    <d-transaction-fields v-else ref="fields" v-model="editor.item" :form-name="editor.formName" @submit="editor.saveItem" />

    <template #footer>
      <template v-if="editor.itemId && !editor.isSplitTransaction">
        <d-button variant="danger" :icon="IconTrash" @click="editor.onDelete">{{ $t('delete') }}</d-button>
        <d-button variant="ghost" :icon="IconCopy" :to="editor.cloneRoute">{{ $t('clone') }}</d-button>
        <d-button variant="ghost" :icon="IconTemplate" :to="editor.templateRoute">{{ $t('transaction.make_template') }}</d-button>
      </template>
      <span class="flex-1" />
      <d-button @click="close">{{ $t('cancel') }}</d-button>
      <d-button v-if="!editor.isSplitTransaction" variant="primary" type="submit" :form="editor.formName" :loading="editor.isLoading">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { IconAdjustmentsHorizontal, IconCopy, IconTemplate, IconTrash } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

const emit = defineEmits(['changed'])

const profileStore = useProfileStore()
const { close } = useRouteDialog(RouteConstants.ROUTE_TRANSACTION_LIST)
const fields = ref(null)
const assistantText = ref('')

const onEvent = (event) => {
  emit('changed')
  const keepOpen = event === useFormEvent.postSave && !editor.itemId && profileStore.resetFormOnCreate
  if (event === useFormEvent.postSave && !keepOpen) close()
}

const editor = reactive(useTransactionEditor({ routeForm: null, onEvent, resetFields: () => (assistantText.value = '') }))
</script>
