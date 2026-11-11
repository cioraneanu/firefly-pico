<template>
  <p class="mx-hint">
    <app-icon :icon="IconHandClick" :size="14" :stroke="2" />
    <span>{{ hint }}</span>
  </p>
  <draggable v-model="modelValue" class="mx-list" handle=".mx-grip" item-key="code">
    <template #item="{ element, index }">
      <div class="mx-row mid mx-ord" :class="{ dim: !element.isVisible }">
        <span class="mx-grip"><app-icon :icon="IconGripVertical" :size="16" :stroke="2" /></span>
        <span class="mx-ord__n">{{ index + 1 }}</span>
        <span class="mx-row__m">
          <span class="mx-row__t">{{ element.t ? $t(element.t) : element.name }}</span>
        </span>
        <button type="button" class="mx-ib sm" :aria-label="element.isVisible ? $t('settings.hide') : $t('settings.show')" @click="element.isVisible = !element.isVisible">
          <app-icon :icon="element.isVisible ? IconEye : IconEyeOff" :size="16" :stroke="2" />
        </button>
      </div>
    </template>
  </draggable>
</template>

<script setup>
import draggable from 'vuedraggable'
import { IconEye, IconEyeOff, IconGripVertical, IconHandClick } from '@tabler/icons-vue'

// Ordered list with visibility toggles (design: .mx-ord rows). Drag the grip to reorder, tap the eye to hide.
// Items are { code, t | name, isVisible }.
const modelValue = defineModel({ type: Array, default: () => [] })

defineProps({
  hint: { type: String, default: '' },
})
</script>
