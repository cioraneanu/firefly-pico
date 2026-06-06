<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('tags')"
    class=""
    :popup-title="$t('tags_select')"
    :list="filteredList"
    :is-multi-select="props.isMultiSelect"
    :get-display-value="getDisplayValue"
    v-bind="dynamicAttrs"
  >

    <template #left-icon>
      <app-icon :icon="TablerIconConstants.tag" :size="20" />
    </template>

    <template #top-right>
      <van-button size="small" class="" @click="onRefresh">
        <app-icon :icon="TablerIconConstants.refresh" :stroke="1.7" size="14" />
      </van-button>

      <van-button size="small" class="" @click="onToggleDisplayMode">
        <app-icon :icon="showGridIcon" :size="14" />
      </van-button>
    </template>

    <template #inputItemContent="{ item }">
      <div class="flex-center gap-1">
        <app-icon :icon="Tag.getIcon(item) ?? TablerIconConstants.tag" :size="18" />
        <span class="font-weight-400 text-size-12">{{ getDisplayValue(item) }}</span>
      </div>
    </template>

    <template #popup>
      <van-grid v-if="showTagSelectAsGrid" :column-num="3">
        <template v-for="(item, index) in filteredList" :key="index">
          <van-grid-item style="cursor: pointer" :class="getOptionClass(item)" @click="onSelectCell(item)">
            <app-select-option :text="Tag.getDisplayNameEllipsized(item)" :icon="Tag.getIcon(item) ?? TablerIconConstants.tag" />
          </van-grid-item>
        </template>
      </van-grid>
      <div v-else>
        <div v-for="(item, index) in filteredList" :key="item.id" @click="onSelectCell(item)">
          <tag-list-item :value="item" :class="getOptionClass(item)" :is-swipeable="false" />
        </div>
      </div>
    </template>
  </app-select>
</template>

<script setup>
import { useTagStore } from '~/stores/tagStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import Tag from '~/models/Tag'

import { isEqual } from 'lodash-es/lang'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { uniqBy } from 'lodash-es/array.js'

const tagStore = useTagStore()
const profileStore = useProfileStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const { showTagSelectAsGrid } = storeToRefs(profileStore)

const props = defineProps({
  label: {
    type: String,
  },
  isMultiSelect: {
    default: true,
  },
  autoSelectParents: {
    default: true,
  },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

const list = ref([])
const isLoading = ref(false)

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return Tag.getDisplayNameEllipsized(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

// ------ Methods ------

onMounted(async () => {
  list.value = tagStore.tagListHierarchy
})

const onSelectCell = (item) => {
  if (props.isMultiSelect) {
    const targetTags = props.autoSelectParents ? Tag.getTagWithParents(item) : [item]

    let newValue = modelValue.value ?? []
    const isSelected = newValue.some((value) => {
      const result = item.id === value.id
      return result
    })
    if (isSelected) {
      newValue = newValue.filter((value) => item.id !== value.id)
      // newValue = newValue.filter(value => !isEqual(item, value))
    } else {
      newValue = uniqBy([...newValue, ...targetTags], 'id')
    }
    modelValue.value = newValue
  } else {
    modelValue.value = item
    showDropdown.value = false
  }
}

const getDisplayValue = (value) => {
  return Tag.getDisplayNameEllipsized(value)
}

const onRefresh = async () => {
  isLoading.value = true
  await tagStore.fetchTags()
  isLoading.value = false
}

const isItemSelected = (option) => {
  if (!modelValue.value) {
    return false
  }
  if (props.isMultiSelect) {
    return modelValue.value.some((item) => item.id == option.id)
  }
  return isEqual(modelValue.value, option)
}

const getOptionClass = (option) => {
  return {
    active: isItemSelected(option),
  }
}

const onToggleDisplayMode = () => {
  showTagSelectAsGrid.value = !showTagSelectAsGrid.value
}

const showGridIcon = computed(() => {
  return showTagSelectAsGrid.value ? 'IconList' : 'IconGridDots'
})
</script>

<style></style>
