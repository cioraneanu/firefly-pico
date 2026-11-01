<template>
  <button
    ref="trigger"
    type="button"
    class="flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-field pl-2.5 pr-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-field/30"
    @click="open = !open"
  >
    <template v-if="model">
      <app-icon :icon="model.icon" :size="18" />
      <span class="flex-1 truncate">{{ model.name }}</span>
      <icon-x :size="14" class="text-dim hover:text-fg" @click.stop="model = null" />
    </template>
    <span v-else class="flex-1 text-dim">{{ $t('icon_empty') }}</span>
    <icon-selector :size="16" class="text-dim" />
  </button>

  <d-popover v-model:open="open" :anchor="trigger" width="24rem">
    <div class="-mx-1 -mt-1 mb-1 flex h-9 shrink-0 items-center gap-2 border-b border-line px-2.5 text-dim">
      <icon-search :size="16" />
      <input v-model="search" autofocus class="h-full flex-1 text-fg" :placeholder="$t('search_placeholder')" />
    </div>
    <d-tabs v-if="tabs.length > 1" v-model="activeTab" :options="tabs" block class="mb-1 shrink-0" />
    <div class="grid grid-cols-8 gap-0.5 overflow-y-auto" @scroll="onScroll">
      <button
        v-for="item in visibleList"
        :key="item.icon"
        type="button"
        :title="item.name"
        :class="['grid aspect-square cursor-pointer place-items-center rounded-md hover:bg-soft', item.icon === model?.icon && 'bg-soft ring-1 ring-ring']"
        @click="pick(item)"
      >
        <app-icon :icon="item.icon" :size="26" />
      </button>
    </div>
    <p v-if="!visibleList.length" class="py-6 text-center text-dim">{{ $t('select_is_empty') }}</p>
  </d-popover>
</template>

<script setup>
import { IconSearch, IconSelector, IconX } from '@tabler/icons-vue'

const model = defineModel()
const props = defineProps({ defaultTab: { type: String, default: 'classic' } })
const trigger = ref(null)
const open = ref(false)

const { search, activeTab, tabs, visibleList, isFinished, loadMore, onOpen } = useIconPicker(model, props.defaultTab)

const onScroll = ({ target }) => !isFinished.value && target.scrollTop + target.clientHeight > target.scrollHeight - 80 && loadMore()

const pick = (item) => {
  model.value = item
  open.value = false
}

watch(open, (value) => value && onOpen())
</script>
