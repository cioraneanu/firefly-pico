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
        <piggy-bank-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import { useList } from '~/composables/useList'
import { useToolbar } from '~/composables/useToolbar'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import PiggyBank from '~/models/PiggyBank.js'

const piggyBankStore = usePiggyBankStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    piggyBankStore.piggyBankList = piggyBankStore.piggyBankList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')
const isSearchVisible = ref(true)

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return PiggyBank.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  title: 'Piggy banks list',
  routeList: RouteConstants.ROUTE_PIGGY_BANK_LIST,
  routeForm: RouteConstants.ROUTE_PIGGY_BANK_ID,
  model: new PiggyBank(),
  onEvent: onEvent,
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

const onRefresh = async () => {
  if (isLoading.value) {
    isRefreshing.value = false
    return
  }
  isLoading.value = true
  isRefreshing.value = true

  await piggyBankStore.fetchPiggyBanks()
  list.value = piggyBankStore.piggyBankList

  // The whole list is fetched in one go => stop van-list from requesting more pages on scroll
  isFinished.value = true
  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = () => {
  onRefresh()
}

// -----

const { t } = useI18n()
const toolbar = useToolbar()
toolbar.init({
  title: t('piggy_banks'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
