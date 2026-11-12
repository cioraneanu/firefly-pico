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
      <d-assistant-input v-model="assistantText" @change="onAssistantChange" @submit="onAssistantSubmit" />
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
      <d-checkbox v-if="!editor.itemId && !editor.isSplitTransaction" v-model="createAnother" class="text-dim">{{ $t('transaction.create_another') }}</d-checkbox>
      <span class="flex-1" />
      <d-button @click="close">{{ $t('cancel') }}</d-button>
      <d-button v-if="!editor.isSplitTransaction" variant="primary" type="submit" :form="editor.formName" :loading="editor.isLoading || !editor.isReady">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { IconAdjustmentsHorizontal, IconArrowsSplit, IconCopy, IconTemplate, IconTrash } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

// listRoute: where closing goes (the TODO Inbox opens it over its own list).
// onChanged is a prop, not an emit: a delete reports back after the dialog is gone (it closes at once, the request runs after its Undo toast).
const props = defineProps({ listRoute: { type: String, default: RouteConstants.ROUTE_TRANSACTION_LIST }, onChanged: { type: Function, default: null } })

const route = useRoute()
const { close } = useRouteDialog(props.listRoute)
const fields = ref(null)
const assistantText = ref('')

// Create another: after saving a new transaction the dialog stays open on an empty form. Only for this dialog, not saved anywhere.
const createAnother = ref(false)

const onEvent = (event, response) => {
  if ([useFormEvent.postSave, useFormEvent.postDelete].includes(event)) props.onChanged?.(event, response, editor.itemId)
  const keepOpen = event === useFormEvent.postSave && !editor.itemId && createAnother.value
  if (event === useFormEvent.postSave && !keepOpen) close()
}

const editor = reactive(useTransactionEditor({ routeForm: null, routeList: props.listRoute, onEvent, resetOnCreate: createAnother, resetFields: () => (assistantText.value = '') }))

// The ⌘K palette opens it with the text typed there (?assistant=…)
onMounted(() => (assistantText.value = route.query.assistant ?? ''))

let applying = null
const onAssistantChange = (change) => (applying = fields.value?.applyAssistantTransaction(change))

// Enter in the assistant saves once its parse is in the form; the form still stops on missing required fields
const onAssistantSubmit = async () => {
  await applying
  await nextTick()
  document.getElementById(editor.formName)?.requestSubmit()
}
</script>
