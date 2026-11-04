<template>
  <div class="flex flex-col gap-2">
    <div v-for="(entry, index) in model" :key="index" class="flex items-center gap-2">
      <d-input v-model="entry.value" class="flex-1" />
      <d-button variant="ghost" size="icon" :icon="IconTrash" class="text-dim" @click="model = model.filter((_, i) => i !== index)" />
    </div>
    <d-button size="sm" :icon="IconPlus" class="self-start" @click="model = [...(model ?? []), { value: '' }]">{{ $t('add') }}</d-button>
  </div>
</template>

<script setup>
import { IconPlus, IconTrash } from '@tabler/icons-vue'

const model = defineModel()
</script>
