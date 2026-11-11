<template>
  <d-button ref="trigger" :icon="IconSearch" :aria-expanded="isOpen" @click="isOpen = !isOpen">
    {{ $t('desktop.filters') }}
    <d-badge v-if="activeFiltersCount" class="px-1.5 text-dim tabular-nums">{{ activeFiltersCount }}</d-badge>
  </d-button>
  <d-popover v-model:open="isOpen" :anchor="trigger" align="end" width="18.75rem">
    <div class="flex flex-col gap-3.5 p-3">
      <span class="font-medium">{{ $t('desktop.filters') }}</span>
      <d-account-select v-model="draft.account" multiple clearable />
      <d-category-select v-if="profileStore.categoriesEnabled" v-model="draft.category" />
      <d-tag-select v-if="profileStore.tagsEnabled" v-model="draft.tag" />
      <div class="-mx-3 -mb-3 mt-0.5 flex justify-end gap-2 border-t border-line px-3 py-3">
        <d-button size="sm" @click="draft = {}">{{ $t('filters.clear') }}</d-button>
        <d-button size="sm" variant="primary" @click="apply">{{ $t('filters.apply_filters') }}</d-button>
      </div>
    </div>
  </d-popover>
</template>

<script setup>
import { IconSearch } from '@tabler/icons-vue'
import { cloneDeep } from 'lodash-es'

const filters = defineModel()
defineProps({ activeFiltersCount: Number })

const profileStore = useProfileStore()
const trigger = ref(null)
const isOpen = ref(false)
const draft = ref({})

watch(isOpen, (open) => open && (draft.value = cloneDeep(filters.value)))

const apply = () => {
  filters.value = draft.value
  isOpen.value = false
}
</script>
