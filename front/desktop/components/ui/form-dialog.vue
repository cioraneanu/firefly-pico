<template>
  <d-dialog open :title :description size="lg" @close="emit('close')">
    <slot name="info" />
    <d-form :id="form.formName" @submit="form.saveItem">
      <slot />
    </d-form>
    <template #footer>
      <d-button v-if="form.itemId" variant="danger" :icon="IconTrash" class="mr-auto" @click="form.onDelete">{{ $t('delete') }}</d-button>
      <d-button @click="emit('close')">{{ $t('cancel') }}</d-button>
      <d-button variant="primary" type="submit" :form="form.formName" :loading="form.isLoading">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { IconTrash } from '@tabler/icons-vue'

defineProps({ form: Object, title: String, description: String })
const emit = defineEmits(['close'])
</script>
