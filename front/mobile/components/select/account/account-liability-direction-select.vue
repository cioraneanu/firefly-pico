<template>
  <app-select
    v-model="modelValue"
    :label="$t('account_page.liability_direction')"
    :popup-title="$t('account_page.liability_direction')"
    :list="list"
    :has-search="false"
    :get-display-value="getDisplayValue"
  />
</template>

<script setup>
import Account from '~/core/models/Account.js'

const modelValue = defineModel()
const list = Account.liabilityDirectionsList()

const { t } = useI18n()
const getDisplayValue = (item) => (item.t ? t(item.t) : item.name)
</script>
