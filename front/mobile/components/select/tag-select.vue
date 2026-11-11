<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    :label="label ?? $t('tags')"
    :popup-title="$t('tags_select')"
    :list="tagStore.tagListHierarchy"
    :is-multi-select="isMultiSelect"
    :get-display-value="getDisplayValue"
    :get-icon-value="getIcon"
  >
    <template #top-right>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
        <span v-if="isLoading" class="mx-spin" />
        <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
      </button>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.toggle_layout')" :aria-pressed="showTagSelectAsGrid" @click="showTagSelectAsGrid = !showTagSelectAsGrid">
        <app-icon :icon="showTagSelectAsGrid ? IconList : IconTags" :size="16" :stroke="2" />
      </button>
    </template>

    <template #popup="{ list }">
      <div v-if="showTagSelectAsGrid" class="mx-pickchips">
        <button v-for="item in list" :key="item.id" type="button" class="mx-chip" :class="{ on: isItemSelected(item) }" :aria-pressed="isItemSelected(item)" @click="onSelectCell(item)">
          <app-icon :icon="getIcon(item)" :size="14" :stroke="2" />
          <span>{{ getDisplayValue(item) }}</span>
        </button>
      </div>
      <template v-else>
        <button
          v-for="item in list"
          :key="item.id"
          type="button"
          class="mx-opt"
          :class="{ on: isItemSelected(item) }"
          :style="getIndentStyle(item)"
          :aria-pressed="isItemSelected(item)"
          @click="onSelectCell(item)"
        >
          <span v-if="isMultiSelect" class="mx-ck" :class="{ on: isItemSelected(item) }"><app-icon :icon="IconCheck" :size="14" :stroke="3" /></span>
          <span class="ic"><app-icon :icon="getIcon(item)" :size="16" :stroke="2" /></span>
          <span class="lb">{{ getDisplayValue(item) }}</span>
          <span v-if="!isMultiSelect" class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
        </button>
      </template>
      <div v-if="list.length === 0" class="mx-none">{{ $t('no_matches') }}</div>
    </template>
  </app-select>
</template>

<script setup>
import { IconCheck, IconList, IconRefresh, IconTags } from '@tabler/icons-vue'
import { get, isEqual, uniqBy } from 'lodash-es'
import { useTagStore } from '~/core/stores/tagStore'
import Tag from '~/core/models/Tag'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

// Tag picker: list (indented by hierarchy) or compact chips, toggled from the sheet header.
// Multi-select also picks the parents of a tag (`autoSelectParents`).
const props = defineProps({
  label: { type: String },
  isMultiSelect: { default: true },
  autoSelectParents: { default: true },
})

const tagStore = useTagStore()
const profileStore = useProfileStore()
const { showTagSelectAsGrid } = storeToRefs(profileStore)

const modelValue = defineModel()
const showDropdown = ref(false)

const getDisplayValue = (value) => Tag.getDisplayNameEllipsized(value)
const getIcon = (value) => Tag.getIcon(value) ?? TablerIconConstants.tag
const getIndentStyle = (item) => (get(item, 'level', 1) > 1 ? { paddingLeft: `${8 + (get(item, 'level') - 1) * 20}px` } : null)

const isItemSelected = (option) => {
  if (!modelValue.value) {
    return false
  }
  return props.isMultiSelect ? modelValue.value.some((item) => item.id == option.id) : isEqual(modelValue.value, option)
}

const onSelectCell = (item) => {
  if (!props.isMultiSelect) {
    modelValue.value = isItemSelected(item) ? null : item
    showDropdown.value = false
    return
  }
  const newValue = modelValue.value ?? []
  if (isItemSelected(item)) {
    modelValue.value = newValue.filter((value) => item.id !== value.id)
  } else {
    const targetTags = props.autoSelectParents ? Tag.getTagWithParents(item) : [item]
    modelValue.value = uniqBy([...newValue, ...targetTags], 'id')
  }
}

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await tagStore.fetchTags()
  isLoading.value = false
}
</script>
