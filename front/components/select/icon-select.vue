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
      <app-tabs v-if="!appStore.isDesktopLayout" v-model="activeTab" :items="tabs" class="mx-3 mb-2" />

      <van-list v-model:loading="isLoadingMore" :finished="visibleCount >= filteredList.length" @load="onLoadMore">
        <van-grid :column-num="6">
          <van-grid-item v-for="item in visibleList" :key="item.icon" class="cursor-pointer" :class="{ active: item.icon === modelValue?.icon }" @click="onSelectCell(item)">
            <div class="flex-center flex-column mt-5 text-size-12">
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
import { useFormAttributes } from '~/composables/useFormAttributes'
import { avatarListIcons, duoToneListIcons, fluentListIcons } from '~/constants/SvgConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Icon from '~/models/Icon.js'
import { useIconStore } from '~/stores/iconStore.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const { t } = useI18n()
const iconStore = useIconStore()
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
const search = ref('')
const activeTab = ref(props.defaultTab)

const tabs = computed(() => [
  { value: 'classic', label: t('icon_select_classic'), list: [...duoToneListIcons, ...fluentListIcons] },
  { value: 'avatars', label: t('icon_select_avatars'), list: avatarListIcons },
  ...(iconStore.customIconList.length > 0 ? [{ value: 'custom', label: t('icon_select_custom'), list: iconStore.customIconList }] : []),
])

const list = computed(() => tabs.value.find((tab) => tab.value === activeTab.value)?.list ?? [])

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((icon) => LanguageUtils.includesSearch(icon.name, search.value))
})

// Each icon is a lazy loaded component => render them in pages while scrolling
const PAGE_SIZE = 60
const visibleCount = ref(PAGE_SIZE)
const isLoadingMore = ref(false)
const visibleList = computed(() => filteredList.value.slice(0, visibleCount.value))

const onLoadMore = () => {
  visibleCount.value += PAGE_SIZE
  isLoadingMore.value = false
}

watch([activeTab, search], () => (visibleCount.value = PAGE_SIZE))

// ------ Methods ------

const getTabForIcon = (icon) => {
  if (Icon.isTypeCustom(icon)) {
    return 'custom'
  }
  if (Icon.isTypeAvatar(icon)) {
    return 'avatars'
  }
  return icon ? 'classic' : props.defaultTab
}

const getDisplayValue = (value) => value?.name

watch(showDropdown, (isShown) => {
  if (isShown) {
    activeTab.value = getTabForIcon(modelValue.value?.icon)
    iconStore.fetchCustomIcons()
  }
})
</script>
