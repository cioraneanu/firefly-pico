<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('icon')"
    :popup-title="$t('icon_select')"
    :get-display-value="getDisplayValue"
    v-bind="dynamicAttrs"
  >
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldIcon" :size="20" />
    </template>

    <template #input>
      <div v-if="!modelValue" class="text-muted">{{ $t('icon_empty') }}</div>
      <app-icon v-else :icon="modelValue.icon" style="width: 25px" />
    </template>

    <template v-if="appStore.isDesktopLayout" #top-right>
      <app-tabs v-model="activeTab" :items="tabs" />
    </template>

    <template #popup="{ onSelectCell }">
      <app-tabs v-if="!appStore.isDesktopLayout" v-model="activeTab" :items="tabs" class="mx-4 mb-2" />

      <van-list v-model:loading="isLoadingMore" :finished="isFinished" @load="onLoadMore">
        <van-grid :column-num="6">
          <van-grid-item v-for="item in visibleList" :key="item.icon" class="cursor-pointer" :class="{ active: item.icon === modelValue?.icon }" @click="onSelectCell(item)">
            <div class="flex items-center justify-center flex-col mt-1.25 text-12">
              <app-icon :icon="item.icon" style="width: 30px" />
              <div class="app-icon-item" />
            </div>
          </van-grid-item>
        </van-grid>
      </van-list>
    </template>
  </app-select>
</template>

<script setup>
import { useFormAttributes } from '~/core/composables/useFormAttributes'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const appStore = useAppStore()

const props = defineProps({
  label: {
    type: String,
  },
  defaultTab: {
    type: String,
    default: 'classic',
  },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const isLoadingMore = ref(false)

const { search, activeTab, tabs, visibleList, isFinished, loadMore, onOpen } = useIconPicker(modelValue, props.defaultTab)

const onLoadMore = () => {
  loadMore()
  isLoadingMore.value = false
}

const getDisplayValue = (value) => value?.name

watch(showDropdown, (isShown) => isShown && onOpen())
</script>
