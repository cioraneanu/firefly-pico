<template>
  <app-field v-model="modelValueCustom" :icon="TablerIconConstants.fieldText1" :label="$t('notes')" :placeholder="$t('notes')" @focus="onFocus" @blur="onBlur" type="textarea" rows="1" autosize>
    <template #right-icon>
      <van-button v-if="isMarkdown && !isFocused" size="small" class="" @click.prevent.stop="onShowPreview">
        <template #icon>
          <div class="display-flex">
            <icon-eye :size="16" :stroke="1.6"  />
          </div>
        </template>
      </van-button>

      <van-dialog v-model:show="isPreviewVisible" confirm-button-text="OK" :close-on-click-overlay="true" style="top: 50%;">
        <div class="p-20">
          <div class="app-toolbar-body" style="overflow: auto; max-height: 70vh" v-html="markdown"></div>
        </div>
      </van-dialog>
    </template>
  </app-field>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants'
import { transactionFormField } from '~/constants/TransactionConstants'
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

const onShowPreview = () => {
  isPreviewVisible.value = true
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


const markdown = computed(() => isMarkdown.value ? marked(modelValue.value) : "")

</script>
