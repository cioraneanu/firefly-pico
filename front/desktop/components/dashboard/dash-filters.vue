<template>
  <d-button ref="trigger" :icon="IconFilter" @click="isOpen = !isOpen">
    {{ $t('desktop.filters') }}
    <d-badge v-if="activeFiltersCount">{{ activeFiltersCount }}</d-badge>
  </d-button>
  <d-popover v-model:open="isOpen" :anchor="trigger" align="end" width="20rem">
    <div class="flex flex-col gap-3 p-2">
      <span class="font-medium">{{ $t('desktop.filters') }}</span>
      <d-account-select v-model="draft.account" multiple clearable />
      <d-category-select v-if="profileStore.categoriesEnabled" v-model="draft.category" />
      <d-tag-select v-if="profileStore.tagsEnabled" v-model="draft.tag" />
      <div class="flex justify-end gap-2 border-t border-line pt-3">
        <d-button size="sm" @click="draft = {}">{{ $t('filters.clear') }}</d-button>
        <d-button size="sm" variant="primary" @click="apply">{{ $t('filters.apply_filters') }}</d-button>
      </div>
    </div>
  </d-popover>
</template>

<script setup>
import { IconFilter } from '@tabler/icons-vue'
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
