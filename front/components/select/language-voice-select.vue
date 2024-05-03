<template>
  <app-select
      label="Language"
      popupTitle="Select a language"
      v-model="appStore.voiceLanguage"
      v-model:showDropdown="showDropdown"
      :list="list"
      :columns="3"
      v-bind="dynamicAttrs"
  />
</template>

<script setup>

import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'
import * as LanguageConstants from '~/constants/LanguageConstants'

const showDropdown = ref(null)
const list = LanguageConstants.OPTIONS_LIST

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const appStore = useAppStore()

</script>