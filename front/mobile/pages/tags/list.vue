<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="list.length > 0" v-model="search" :placeholder="$t('tag_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <tag-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.tag" :hint="$t('tag_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('tag_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useTagStore } from '~/core/stores/tagStore'
import { useList } from '~/core/composables/useList'
import Tag from '~/core/models/Tag'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const tagStore = useTagStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    tagStore.tagList = tagStore.tagList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const search = ref('')
const filteredList = computed(() => (search.value ? list.value.filter((item) => LanguageUtils.includesSearch(Tag.getDisplayNameEllipsized(item), search.value)) : list.value))

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_TAG_LIST,
  routeForm: RouteConstants.ROUTE_TAG_ID,
  model: new Tag(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true
  await tagStore.fetchTags()
  isLoading.value = false
  isRefreshing.value = false
  onLoadMore()
}

// The whole list comes from the store (as a parent/child hierarchy), so one load finishes it
const onLoadMore = () => {
  list.value = tagStore.tagListHierarchy
  isFinished.value = true
}

const { t } = useI18n()
useToolbar().init({
  title: t('tags'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
