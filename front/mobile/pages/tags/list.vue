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

        <tag-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useTagStore } from '~/core/stores/tagStore'
import { useList } from '~/core/composables/useList'
import Tag from '~/core/models/Tag'
import { useToolbar } from '~/mobile/composables/useToolbar'
import EmptyList from '~/mobile/components/general/empty-list.vue'
import AppListSearch from '~/mobile/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const tagStore = useTagStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    tagStore.tagList = tagStore.tagList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const search = ref('')
const isSearchVisible = ref(true)
const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return LanguageUtils.includesSearch(Tag.getDisplayNameEllipsized(item), search.value)
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

  const tagStore = useTagStore()
  await tagStore.fetchTags()

  isLoading.value = false
  isRefreshing.value = false

  onLoadMore()
}

const onLoadMore = () => {
  const tagStore = useTagStore()
  // list.value = tagStore.tagList
  list.value = tagStore.tagListHierarchy
  // The whole list comes from the store => stop van-list from triggering more loads on scroll
  isFinished.value = true
}

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: t('tags'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)


</script>
