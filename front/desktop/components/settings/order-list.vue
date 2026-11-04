<template>
  <draggable v-model="model" item-key="code" handle=".handle" class="divide-y divide-line overflow-hidden rounded-lg border border-line">
    <template #item="{ element }">
      <div :class="['flex h-10 items-center gap-2 bg-card px-2', !element.isVisible && 'text-dim']">
        <icon-grip-vertical :size="16" class="handle cursor-grab text-dim" />
        <span class="flex-1 truncate">{{ $t(element.t ?? element.name) }}</span>
        <d-switch v-model="element.isVisible" />
      </div>
    </template>
  </draggable>
</template>

<script setup>
import draggable from 'vuedraggable'
import { IconGripVertical } from '@tabler/icons-vue'

const model = defineModel()
</script>
