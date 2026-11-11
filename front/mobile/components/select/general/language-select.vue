<template>
  <app-select
    v-model="modelValue"
    :label="$t('language_select.label')"
    :popup-title="$t('language_select.title')"
    :list="list"
    :has-search="false"
    :clearable="false"
    :get-display-value="(item) => item.displayName"
    :get-icon-value="(item) => item.icon"
  />
</template>

<script setup>
import { supportedLanguages } from '~/i18n/index.js'

// Internally use the language object, externally use just the code: "en"
const modelValue = defineModel({
  set: (value) => value?.code,
  get: (value) => list.value.find((item) => item.code === value),
})

const list = computed(() => supportedLanguages)
</script>
