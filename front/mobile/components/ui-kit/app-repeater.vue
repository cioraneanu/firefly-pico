<template>
  <div class="flex flex-col gap-2">
    <draggable v-model="modelValue" handle=".grip" class="mx-repeat" item-key="id">
      <template #item="{ element, index }">
        <div class="mx-rep">
          <span v-if="!disabled && isDraggable" class="grip mx-grip"><app-icon :icon="IconGripVertical" :size="16" :stroke="2" /></span>
          <div class="flex-1 min-w-0">
            <slot name="content" v-bind="{ index, element, removeItemAtIndex }" />
          </div>
          <button v-if="!disabled && isListDynamic" type="button" class="mx-ib out mx-ib40" :aria-label="$t('delete')" @click="removeItemAtIndex(index)">
            <app-icon :icon="IconTrash" :size="16" :stroke="2" />
          </button>
        </div>
      </template>
    </draggable>

    <p v-if="isListEmpty" class="mx-d">{{ $t('repeater_no_values') }}</p>
    <button v-if="!disabled && isListDynamic" type="button" class="mx-btn sm out self-start" @click="addItem">
      <app-icon :icon="IconPlus" :size="16" :stroke="2" />
      <span>{{ $t('add') }}</span>
    </button>
  </div>
</template>

<script setup>
import { IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-vue'
import { cloneDeep, isEmpty } from 'lodash-es'
import draggable from 'vuedraggable'

// Editable list (design: .mx-repeat / .mx-rep): drag handle, the row content from the `content` slot, a remove button,
// and Add below. `isListDynamic: false` keeps the rows fixed (reorder only).
const props = defineProps({
  emptyItem: {},
  isDraggable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  isListDynamic: { type: Boolean, default: true },
})

const modelValue = defineModel()

const isListEmpty = computed(() => isEmpty(modelValue.value))

const addItem = () => {
  const oldValue = modelValue.value ?? []
  oldValue.push(cloneDeep(props.emptyItem) ?? {})
  modelValue.value = oldValue
}
const removeItemAtIndex = (index) => {
  modelValue.value.splice(index, 1)
}
</script>
