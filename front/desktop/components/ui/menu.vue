<template>
  <d-button ref="trigger" variant="ghost" size="icon-sm" :icon="IconDots" class="text-dim" :aria-expanded="open" @click.stop.prevent="open = !open" />
  <d-popover v-model:open="open" :anchor="trigger" align="end">
    <button
      v-for="item in items"
      :key="item.label"
      type="button"
      :class="[
        'flex w-full cursor-default items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 text-left',
        item.danger ? 'text-danger hover:bg-danger/10 dark:hover:bg-danger/20' : 'hover:bg-soft',
      ]"
      @click.stop="select(item)"
    >
      <component :is="item.icon" v-if="item.icon" :size="16" :class="!item.danger && 'text-dim'" />
      {{ item.label }}
    </button>
  </d-popover>
</template>

<script setup>
import { IconDots } from '@tabler/icons-vue'

defineProps({ items: Array })

const trigger = ref(null)
const open = ref(false)

const select = (item) => {
  open.value = false
  item.action()
}
</script>
