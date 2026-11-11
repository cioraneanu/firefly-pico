<template>
  <d-dialog open :title="editor.title" size="xl" @close="close">
    <template #actions>
      <d-badge v-if="editor.isSplitTransaction" variant="outline"><icon-arrows-split :size="12" />{{ $t('transaction.split_short') }}</d-badge>
      <d-button
        variant="ghost"
        size="icon-sm"
        :icon="IconAdjustmentsHorizontal"
        class="text-dim"
        :to="RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS"
        :title="$t('transaction.configure_fields')"
      />
    </template>

    <template v-if="editor.isReady && !editor.itemId && !editor.isCloning">
      <d-assistant-input v-model="assistantText" @change="(change) => fields?.applyAssistantTransaction(change)" />
      <div class="h-px bg-line" />
    </template>

    <!-- An empty stand-in keeps the dialog's size while loading; the real fields mount with the data so their watchers skip hydration -->
    <d-transaction-fields v-if="!editor.isReady" />
    <d-split-view v-else-if="editor.isSplitTransaction" :transaction="editor.item" />
    <d-transaction-fields v-else ref="fields" v-model="editor.item" :form-name="editor.formName" @submit="editor.saveItem" />

    <template #footer>
      <template v-if="editor.itemId && !editor.isSplitTransaction">
        <d-button variant="danger" :icon="IconTrash" @click="editor.onDelete">{{ $t('delete') }}</d-button>
        <d-button :icon="IconCopy" :to="editor.cloneRoute">{{ $t('clone') }}</d-button>
        <d-button :icon="IconTemplate" :to="editor.templateRoute">{{ $t('transaction.make_template') }}</d-button>
      </template>
      <span class="flex-1" />
      <d-button @click="close">{{ $t('cancel') }}</d-button>
      <d-button v-if="!editor.isSplitTransaction" variant="primary" type="submit" :form="editor.formName" :loading="editor.isLoading || !editor.isReady">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { IconAdjustmentsHorizontal, IconArrowsSplit, IconCopy, IconTemplate, IconTrash } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

// listRoute: where closing goes (the TODO Inbox opens it over its own list)
const props = defineProps({ listRoute: { type: String, default: RouteConstants.ROUTE_TRANSACTION_LIST } })
const emit = defineEmits(['changed'])

const profileStore = useProfileStore()
const { close } = useRouteDialog(props.listRoute)
const fields = ref(null)
const assistantText = ref('')

const onEvent = (event, response) => {
  if ([useFormEvent.postSave, useFormEvent.postDelete].includes(event)) emit('changed', event, response)
  const keepOpen = event === useFormEvent.postSave && !editor.itemId && profileStore.resetFormOnCreate
  if (event === useFormEvent.postSave && !keepOpen) close()
}

const editor = reactive(useTransactionEditor({ routeForm: null, routeList: props.listRoute, onEvent, resetFields: () => (assistantText.value = '') }))
</script>
