<template>
  <div ref="swipeRef" class="mx-swipe" :class="{ 'no-del': !deletable }">
    <div class="mx-row" :class="rowClass" role="button" tabindex="0" @click="onEdit" @keydown.enter="onEdit">
      <slot />
    </div>
    <button v-if="deletable" type="button" class="mx-swipe__del" :aria-label="$t('delete')" @click.stop="onDelete">
      <app-icon :icon="IconTrash" :size="18" :stroke="2" />
      <span>{{ $t('delete') }}</span>
    </button>
  </div>
</template>

<script setup>
import { IconTrash } from '@tabler/icons-vue'

// List row of the mobile kit: swipe left to reveal Delete (native horizontal scroll + snap, as in the design).
// Tapping a row that is swiped open closes it instead of opening the item.
defineProps({
  rowClass: { default: 'mid' },
  deletable: { type: Boolean, default: true },
})

const emit = defineEmits(['onEdit', 'onDelete'])
const swipeRef = ref(null)

const onEdit = () => {
  if (swipeRef.value?.scrollLeft > 4) {
    swipeRef.value.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }
  emit('onEdit')
}

const onDelete = () => {
  swipeRef.value?.scrollTo({ left: 0 })
  emit('onDelete')
}
</script>
