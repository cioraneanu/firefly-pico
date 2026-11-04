<template>
  <div class="flex flex-wrap items-center gap-3">
    <d-input v-model="model" :icon="IconSearch" :placeholder="$t('search_placeholder')" clearable class="w-90" />
    <span class="ml-auto text-[13px] tabular-nums text-dim">{{ count }} {{ $t('items') }}</span>
  </div>
</template>

<script setup>
import { IconSearch } from '@tabler/icons-vue'

const model = defineModel()
defineProps({ count: Number })
</script>
