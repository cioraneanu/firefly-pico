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

        <tag-list-item v-for="item in filteredList" :key="item.id" :value="item" @onEdit="onEdit" @onDelete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import { useList } from '~/composables/useList'
import Tag from '~/models/Tag'
import { useToolbar } from '~/composables/useToolbar'
import EmptyList from '~/components/general/empty-list.vue'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/utils/AnimationUtils.js'

let dataStore = useDataStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    dataStore.tagList = dataStore.tagList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const search = ref('')
const isSearchVisible = ref(true)
const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return Tag.getDisplayNameEllipsized(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  title: 'Tags list',
  routeList: RouteConstants.ROUTE_TAG_LIST,
  routeForm: RouteConstants.ROUTE_TAG_ID,
  model: new Tag(),
  onEvent: onEvent,
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const dataStore = useDataStore()
  await dataStore.fetchTags()

  isLoading.value = false
  isRefreshing.value = false

  onLoadMore()
}

const onLoadMore = () => {
  const dataStore = useDataStore()
  // list.value = dataStore.tagList
  list.value = dataStore.tagListHierarchy
  // list.value = sortByPath(dataStore.tagList, 'attributes.tag')
  // list.value = dataStore.tagList.sort((a,b) => (a.attributes.tag > b.attributes.tag) ? 1 : ((b.attributes.tag > a.attributes.tag) ? -1 : 0))
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Tags list',
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)


</script>
