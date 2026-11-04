<template>
  <d-select v-model="model" :options :get-label="(item) => Tag.getDisplayName(item)" :get-icon="getIcon" :get-indent="getIndent" :icon="IconTag" :placeholder="$t('tags_select')" :multiple clearable />
</template>

<script setup>
import { IconTag } from '@tabler/icons-vue'
import Tag from '~/core/models/Tag'

const model = defineModel()
const props = defineProps({ multiple: Boolean, exclude: { type: Array, default: () => [] } })

const tagStore = useTagStore()

const options = computed(() => tagStore.tagListHierarchy.filter((tag) => !props.exclude.includes(tag.id)))
const getIcon = (tag) => Tag.getIcon(tag) ?? IconTag
const getIndent = (tag) => Tag.getTagWithParents(tag).length - 1
</script>
