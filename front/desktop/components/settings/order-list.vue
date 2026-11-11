<template>
  <draggable v-model="model" item-key="code" handle=".handle" class="divide-y divide-line overflow-hidden rounded-lg border border-line">
    <template #item="{ element, index }">
      <div class="flex min-h-11 items-center gap-2.5 bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-soft/40">
        <span class="handle grid h-7 w-6 shrink-0 cursor-grab place-items-center rounded-md text-dim transition-colors hover:bg-soft hover:text-fg">
          <icon-grip-vertical :size="16" />
        </span>
        <span class="w-[18px] shrink-0 text-right text-xs tabular-nums text-dim">{{ index + 1 }}</span>
        <span :class="['flex-1 truncate font-medium', !element.isVisible && 'text-dim']">{{ $t(element.t ?? element.name) }}</span>
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
