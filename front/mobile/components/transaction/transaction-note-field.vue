<template>
  <app-field v-model="modelValueCustom" :label="$t('notes')" :placeholder="$t('notes')" type="textarea" rows="1" autosize @focus="onFocus" @blur="onBlur">
    <template #right>
      <button
        v-if="isMarkdown && !isFocused"
        type="button"
        class="mx-ib sm"
        style="margin-right: -8px"
        :aria-label="$t('transaction.assistant_ramble_preview')"
        @click.prevent.stop="isPreviewVisible = true"
      >
        <app-icon :icon="IconEye" :size="16" :stroke="2" />
      </button>

      <app-sheet v-model:show="isPreviewVisible" :title="$t('notes')">
        <div class="mx-prose transaction-notes-markdown" v-html="markdown" />
        <template #footer>
          <button type="button" class="mx-btn pri" @click="isPreviewVisible = false">{{ $t('ok') }}</button>
        </template>
      </app-sheet>
    </template>
  </app-field>
</template>
<script setup>
import { IconEye } from '@tabler/icons-vue'
import { marked } from 'marked'

const modelValue = defineModel()
const isFocused = ref(false)
const isPreviewVisible = ref(false)

const modelValueCustom = computed({
  get() {
    return isFocused.value ? modelValue.value : modelValueSummary.value
  },
  set(value) {
    modelValue.value = value
  },
})

const modelValueSummary = computed(() => {
  const maxLength = 50
  const text = modelValue.value ?? ''
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
})

const onFocus = () => {
  isFocused.value = true
}
const onBlur = () => {
  isFocused.value = false
}

const isMarkdown = computed(() => {
  if (!modelValue.value || typeof modelValue.value !== 'string') return false

  const markdownPatterns = [
    /^#{1,6}\s.+/m, // headings: # H1, ## H2, etc.
    /^\s*[-*+]\s.+/m, // unordered lists: - item, * item
    /^\s*\d+\.\s.+/m, // ordered lists: 1. item
    /\*\*(.*?)\*\*/s, // bold: **text**
    /\*(.*?)\*/s, // italic: *text*
    /!\[.*?\]\(.*?\)/, // image: ![alt](url)
    /\[.*?\]\(.*?\)/, // link: [text](url)
    /`{1,3}[^`]+`{1,3}/, // inline code or code block
    /^>{1,3}\s.+/m, // blockquote: > text
  ]

  return markdownPatterns.some((regex) => regex.test(modelValue.value))
})

const markdown = computed(() => (isMarkdown.value ? marked(modelValue.value) : ''))
</script>
