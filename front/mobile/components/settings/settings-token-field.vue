<template>
  <div class="mx-f" :class="{ bad: !!error }">
    <div class="mx-l">{{ props.label ?? $t('settings.token.label') }}<span v-if="isRequired" class="req">*</span></div>
    <div class="mx-sel" role="button" tabindex="0" aria-haspopup="dialog" :aria-label="props.label ?? $t('settings.token.label')" @click="onOpen" @keydown.enter.prevent="onOpen">
      <span class="val">
        <app-icon :icon="IconKey" :size="16" :stroke="2" />
        <span v-if="modelValue" class="tx mx-mask">{{ maskedToken }}</span>
        <span v-else class="ph">{{ $t('settings.token.placeholder') }}</span>
      </span>
      <span class="chev"><app-icon :icon="IconPencil" :size="16" :stroke="2" /></span>
    </div>
    <div v-if="error" class="mx-ferr">{{ error }}</div>
    <div v-else class="mx-d">{{ $t('settings.token.description') }}</div>

    <app-sheet v-model:show="showSheet" :title="props.label ?? $t('settings.token.label')">
      <div class="mx-form">
        <div class="mx-f">
          <label v-if="isTokenVisible || !draft" class="mx-in ta mono">
            <textarea v-model="draft" rows="5" :placeholder="$t('settings.token.placeholder')" :aria-label="$t('settings.token.label')" />
          </label>
          <div v-else class="mx-in" style="min-height: 64px">
            <span class="mx-mask">{{ maskedDraft }}</span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" class="mx-btn out" @click="onPaste">
            <app-icon :icon="IconClipboardText" :size="16" :stroke="2" />
            <span>{{ $t('paste') }}</span>
          </button>
          <button type="button" class="mx-btn out" @click="onCopy">
            <app-icon :icon="IconCopy" :size="16" :stroke="2" />
            <span>{{ $t('copy') }}</span>
          </button>
          <button type="button" class="mx-btn out" @click="isTokenVisible = !isTokenVisible">
            <app-icon :icon="isTokenVisible ? IconEyeOff : IconEye" :size="16" :stroke="2" />
            <span>{{ isTokenVisible ? $t('settings.token.hide') : $t('settings.token.show') }}</span>
          </button>
        </div>
        <div class="mx-note">
          <app-icon :icon="IconLock" :size="16" :stroke="2" />
          <span>{{ $t('settings.token.note') }}</span>
        </div>
      </div>

      <template #footer>
        <button type="button" class="mx-btn out" @click="showSheet = false">{{ $t('cancel') }}</button>
        <button type="button" class="mx-btn pri" @click="onSave">{{ $t('save') }}</button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { IconClipboardText, IconCopy, IconEye, IconEyeOff, IconKey, IconLock, IconPencil } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { rule } from '~/core/utils/ValidationUtils.js'

const { t } = useI18n()

const props = defineProps({
  label: {
    type: String,
  },
  required: {
    type: Boolean,
    default: false,
  },
})
const modelValue = defineModel()

const { error, isRequired } = useFormField({ name: () => 'authToken', rules: () => (props.required ? [rule.required()] : []), value: modelValue })

const showSheet = ref(false)
const isTokenVisible = ref(false)
const draft = ref('')

const mask = (value) => (value ? `••••••••••••${String(value).slice(-4)}` : '')
const maskedToken = computed(() => mask(modelValue.value))
const maskedDraft = computed(() => mask(draft.value))

const onOpen = () => {
  draft.value = modelValue.value ?? ''
  isTokenVisible.value = false
  showSheet.value = true
}

const onSave = () => {
  modelValue.value = draft.value
  showSheet.value = false
}

const onCopy = () => {
  navigator.clipboard.writeText(draft.value)
  UIUtils.showToastSuccess(t('copied'))
}
const onPaste = async () => {
  draft.value = await navigator.clipboard.readText()
  UIUtils.showToastSuccess(t('pasted'))
}
</script>
