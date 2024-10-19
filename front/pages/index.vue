<template>
  <component :is="startingPage" />
</template>

<script setup>
import TransactionCreate from './transactions/[[id]].vue'
import TransactionList from './transactions/list.vue'
import Dashboard from './dashboard.vue'
import Page from '~/models/Page.js'

const profileStore = useProfileStore()

let startingPage = computed(() => {
  switch (profileStore.startingPage?.code) {
    case Page.types.transactionNew.code:
      return markRaw(TransactionCreate)
    case Page.types.transactionList.code:
      return markRaw(TransactionList)
    case Page.types.dashboard.code:
      return markRaw(Dashboard)
  }

  return markRaw(TransactionCreate)
})
</script>
