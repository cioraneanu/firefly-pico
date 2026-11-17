<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('icon')"
    :popup-title="$t('icon_select')"
    :get-display-value="getDisplayValue"
    :has-search="true"
    full
  >
    <template #input>
      <span v-if="!modelValue" class="ph">{{ $t('icon_empty') }}</span>
      <template v-else>
        <span class="mx-lead sm"><app-icon :icon="modelValue.icon" :size="16" :stroke="2" /></span>
        <span class="tx min-w-0 truncate">{{ getDisplayValue(modelValue) }}</span>
      </template>
    </template>

    <template #popup="{ onSelectCell }">
      <app-tabs v-model="activeTab" :items="tabs" class="mx-1 mb-2" />
      <app-list :loading="isLoadingMore" :finished="isFinished" :pullable="false" @load="onLoadMore">
        <div class="mx-ogrid">
          <button v-for="item in visibleList" :key="item.icon" type="button" :class="{ on: item.icon === modelValue?.icon }" :aria-label="getDisplayValue(item)" @click="onSelectCell(item)">
            <app-icon :icon="item.icon" :size="22" :stroke="1.75" />
          </button>
        </div>
      </app-list>
    </template>
  </app-select>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: null },
  defaultTab: { type: String, default: 'classic' },
})

const modelValue = defineModel()
const showDropdown = ref(false)
const isLoadingMore = ref(false)

const { search, activeTab, tabs, visibleList, isFinished, loadMore, onOpen } = useIconPicker(modelValue, props.defaultTab)

// loading flips true → false around each page so app-list observes again (the next page loads while the end is still in view)
const onLoadMore = async () => {
  isLoadingMore.value = true
  loadMore()
  await nextTick()
  isLoadingMore.value = false
}

const getDisplayValue = (value) => value?.name

watch(showDropdown, (isShown) => isShown && onOpen())
</script>
