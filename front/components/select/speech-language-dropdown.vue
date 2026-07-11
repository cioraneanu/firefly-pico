<template>
  <div class="speech-language-dropdown cursor-pointer currency-dropdown">
    <van-popover v-model:show="showPopover" :actions="languages" @select="onSelect">
      <template #reference>
        <div class="flex-center-vertical gap-1" :class="$attrs.class">
          <app-icon v-if="selectedLanguage" :icon="`svgo-flags-${selectedLanguage.flag}`" :size="16" />
          <span>{{ selectedShortCode }}</span>
          <icon-caret-down :size="18" />
        </div>
      </template>

      <template #action="{ action }">
        <div class="flex-center-vertical gap-2">
          <app-icon :icon="`svgo-flags-${action.flag}`" :size="18" />
          {{ action.name }}
        </div>
      </template>
    </van-popover>
  </div>
</template>

<script setup>
import { IconCaretDown } from '@tabler/icons-vue'
import * as LanguageConstants from '~/constants/LanguageConstants.js'

const modelValue = defineModel({ type: String, default: null })

const showPopover = ref(false)
const languages = LanguageConstants.OPTIONS_LIST

const selectedLanguage = computed(() => languages.find((language) => language.code === modelValue.value))
const selectedShortCode = computed(() => (modelValue.value ?? LanguageConstants.LANGUAGE_ENGLISH).split('-')[0].toUpperCase())

const onSelect = (language) => {
  modelValue.value = language.code
}
</script>
