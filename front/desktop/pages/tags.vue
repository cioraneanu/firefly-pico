<template>
  <d-page :title="$t('tags')" :description="$t('desktop.tags_description')">
    <template #actions>
      <d-refresh-button :action="tagStore.fetchTags" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_TAG_ID">{{ $t('tag_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="tag in filtered"
        :key="tag.id"
        :title="Tag.getDisplayName(tag)"
        :subtitle="subtitle(tag)"
        :icon="Tag.getIcon(tag) ?? IconTag"
        :indent="search ? 0 : Tag.getTagWithParents(tag).length - 1"
        :to="`${RouteConstants.ROUTE_TAG_ID}/${tag.id}`"
        :active="tag.id === id"
      >
        <template v-if="tag.attributes.is_todo" #title>
          <d-badge variant="warning">{{ $t('todo') }}</d-badge>
        </template>
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconTag" />
    </d-list>

    <d-tag-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconPlus, IconTag } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Tag from '~/core/models/Tag'

const tagStore = useTagStore()
const { t } = useI18n()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_TAG_LIST)
const { search, filtered } = useSearch(
  () => tagStore.tagListHierarchy,
  (item) => Tag.getDisplayName(item),
)

const subtitle = (tag) =>
  [
    tag.attributes.date && `${t('tag_page.end_date')}: ${DateUtils.dateToUI(tag.attributes.date)}`,
    Tag.getTotalFormatted(tag) && `${t('tag_page.total')}: ${Tag.getTotalFormatted(tag)}`,
    tag.attributes.description,
  ]
    .filter(Boolean)
    .join(' · ')
</script>
