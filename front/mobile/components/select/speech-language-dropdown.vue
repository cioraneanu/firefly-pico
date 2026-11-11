<template>
  <span class="mx-cdd">
    <button type="button" class="mx-btn sm out" aria-haspopup="dialog" :aria-label="$t('settings.assistant.transcription_language')" @click.stop="showDropdown = true">
      <app-icon v-if="selectedLanguage" :icon="`svgo-flags-${selectedLanguage.flag}`" :size="16" />
      <span>{{ selectedShortCode }}</span>
      <app-icon :icon="IconChevronDown" :size="16" :stroke="2" />
    </button>

    <app-sheet v-model:show="showDropdown" :title="$t('settings.assistant.transcription_language')">
      <button
        v-for="language in languages"
        :key="language.code"
        type="button"
        class="mx-opt"
        :class="{ on: language.code === modelValue }"
        :aria-pressed="language.code === modelValue"
        @click="onSelect(language)"
      >
        <span class="ic"><app-icon :icon="`svgo-flags-${language.flag}`" :size="18" /></span>
        <span class="lb">{{ language.name }}</span>
        <span class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
      </button>
    </app-sheet>
  </span>
</template>

<script setup>
import { IconCheck, IconChevronDown } from '@tabler/icons-vue'
import * as LanguageConstants from '~/core/constants/LanguageConstants.js'

const modelValue = defineModel({ type: String, default: null })

const showDropdown = ref(false)
const languages = LanguageConstants.OPTIONS_LIST

const selectedLanguage = computed(() => languages.find((language) => language.code === modelValue.value))
const selectedShortCode = computed(() => (modelValue.value ?? LanguageConstants.LANGUAGE_ENGLISH).split('-')[0].toUpperCase())

const onSelect = (language) => {
  modelValue.value = language.code
  showDropdown.value = false
}
</script>
