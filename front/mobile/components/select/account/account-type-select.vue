<template>
  <app-select v-model="modelValue" :label="$t('account_page.account_type')" :popup-title="$t('account_page.account_type')" :list="list" :has-search="false" :get-display-value="getDisplayValue" />
</template>

<script setup>
import Account from '~/core/models/Account.js'

const modelValue = defineModel()
const list = Account.typesList()

const { t } = useI18n()
const getDisplayValue = (item) => (item.t ? t(item.t) : item.name)
</script>
