<template>
  <app-select v-model="modelValue" :label="$t('settings.formatting.date_format')" :popup-title="$t('settings.formatting.select_date_format')" :list="list" :has-search="false" />
</template>

<script setup>
import Account from '~/core/models/Account'

const modelValue = defineModel()
const list = Account.roleAssetsList()
</script>
