<template>
  <app-sheet v-model:show="show" :title="title">
    <template v-if="description" #top>
      <p class="mx-sh__d">{{ description }}</p>
    </template>

    <template #footer>
      <button v-if="editLabel" type="button" class="mx-btn out" @click="onAction('edit')">{{ editLabel }}</button>
      <button type="button" class="mx-btn pri" @click="onAction('transactions')">
        <app-icon :icon="IconListDetails" :size="16" :stroke="2" />
        <span>{{ $t('show_transactions') }}</span>
      </button>
    </template>
  </app-sheet>
</template>

<script setup>
import { IconListDetails } from '@tabler/icons-vue'

// Details sheet of a dashboard tile / bar: "Edit {item}" + "Show transactions" (replaces the old action sheet).
const show = defineModel('show', { type: Boolean, default: false })

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: null },
  editLabel: { type: String, default: null },
})

const emit = defineEmits(['edit', 'transactions'])

const onAction = (action) => {
  show.value = false
  emit(action)
}
</script>
