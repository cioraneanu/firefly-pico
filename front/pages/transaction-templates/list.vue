<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <empty-list v-if="isEmpty" />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <app-list-search v-if="isSearchVisible && list.length > 0" v-model="search" />

        <transaction-template-list-item v-for="item in filteredList" :key="item.id" :value="item" @onEdit="onEdit" @onDelete="onDelete" />
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
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import Tag from '~/models/Tag.js'

const dataStore = useDataStore()
const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    dataStore.transactionTemplateList = dataStore.transactionTemplateList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const search = ref('')
const isSearchVisible = ref(true)
const filteredList = computed(() => {
  const sortedList = [...list.value].sort((a,b) => TransactionTemplate.getDisplayName(a) > TransactionTemplate.getDisplayName(b))
  if (search.value.length === 0) {
    return sortedList
  }
  return sortedList.filter((item) => {
    return TransactionTemplate.getAllNames(item).some(item => item.toLowerCase().indexOf(search.value.toLowerCase()) !== -1)
  })
})


const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
  model: new TransactionTemplate(),
  onEvent: onEvent,
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
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

onMounted(() => {})

// ----

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: t('templates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)


</script>
