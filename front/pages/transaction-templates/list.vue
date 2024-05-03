<template>

  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd"/>
      </template>
    </app-top-toolbar>


    <empty-list v-if="isEmpty"/>

    <van-pull-refresh
        v-model="isRefreshing"
        @refresh="onRefresh">

      <van-list
          class="p-1"
          :finished="isFinished"
          @load="onLoadMore"
      >

        <transaction-template-list-item
            v-for="item in list"
            :key="item.id"
            :value="item"
            @onEdit="onEdit"
            @onDelete="onDelete"
        />

      </van-list>

    </van-pull-refresh>


  </div>

</template>


import { ref } from 'vue';

<script setup>

import RouteConstants from '~/constants/RouteConstants'
import { useList } from '~/composables/useList'
import TransactionTemplate from '~/models/TransactionTemplate'
import { useDataStore } from '~/stores/dataStore'
import { useToolbar } from '~/composables/useToolbar'

const dataStore = useDataStore()
const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    dataStore.transactionTemplateList = dataStore.transactionTemplateList.filter(item => parseInt(item.id) !== parseInt(payload.id))
  }
}

const {
  title,
  isLoading, isFinished, isRefreshing,
  page, pageSize, totalPages, listTotalCount,
  list, isEmpty,
  onAdd, onEdit, onDelete,
} = useList({
  title: 'Transaction templates list',
  routeList: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
  model: new TransactionTemplate(),
  onEvent: onEvent
})

const formClass = computed(() => ({
  'app-form': true,
  'empty': isEmpty.value
}))


const onLoadMore = async () => {
  const dataStore = useDataStore()
  list.value = dataStore.transactionTemplateList
}

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const dataStore = useDataStore()
  await dataStore.fetchTransactionTemplates()

  isLoading.value = false
  isRefreshing.value = false
  await onLoadMore()
}

onMounted(() => {
})

// ----

const toolbar = useToolbar()
toolbar.init({
  title: 'Templates list',
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

</script>