<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <d-input v-model="text" :icon="IconSparkles" :placeholder="`${$t('transaction.assistant')}…`" :autofocus="profileStore.autoFocusAssistant" clearable class="flex-1" />
      <div class="w-32">
        <d-currency-select v-model="profileStore.assistantCurrency" clearable />
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-1.5 text-[13px] text-dim">
      <template v-if="previewTags.length || parsed.isTodo">
        <d-badge v-for="tag in previewTags" :key="tag.label" variant="outline">
          <span class="text-dim">{{ tag.label }}</span>
          {{ tag.value }}
        </d-badge>
        <d-badge v-if="parsed.isTodo" variant="warning">{{ $t('todo') }}</d-badge>
      </template>
      <span v-else>{{ $t('transaction.assistant_format') }}</span>
    </div>
  </div>
</template>

<script setup>
import { IconSparkles } from '@tabler/icons-vue'

const text = defineModel()
const emit = defineEmits(['change'])

const profileStore = useProfileStore()
const { parsed, previewTags } = useTransactionAssistant(text, (change) => emit('change', change))
</script>
