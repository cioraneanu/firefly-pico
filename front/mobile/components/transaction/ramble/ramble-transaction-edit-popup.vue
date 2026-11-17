<template>
  <app-sheet v-model:show="show" :title="$t('transaction.assistant_ramble_edit_title')" full>
    <app-form v-if="transaction" ref="formRef" name="ramble-transaction-form" class="flex flex-col gap-3 pb-3" @submit="onSave" @failed="onFailed">
      <transaction-form v-model="transaction.item" />
    </app-form>

    <template #footer>
      <button type="button" class="mx-btn out" @click="show = false">{{ $t('cancel') }}</button>
      <button type="button" class="mx-btn pri" @click="formRef?.submit()">
        <app-icon :icon="IconCheck" :size="16" :stroke="2" />
        <span>{{ $t('save') }}</span>
      </button>
    </template>
  </app-sheet>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'
import TransactionForm from '~/mobile/components/transaction/TransactionForm.vue'
import UIUtils from '~/core/utils/UIUtils.js'

// Edit one interpreted ramble transaction in a full sheet with the regular transaction fields.
const emit = defineEmits(['save'])
const show = defineModel('show', { type: Boolean, default: false })
const transaction = defineModel({ type: Object, default: null })

const formRef = ref(null)

const onFailed = () => UIUtils.showToastError('Form has invalid values. Check the red fields :)')

const onSave = () => {
  emit('save', transaction.value)
  show.value = false
}
</script>
