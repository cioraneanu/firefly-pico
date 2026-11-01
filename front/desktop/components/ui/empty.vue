<template>
  <div class="flex flex-col items-center gap-2.5 px-4 py-12 text-center text-sm text-dim">
    <span class="grid size-10 place-items-center rounded-lg bg-soft text-fg">
      <app-icon :icon="icon ?? IconInbox" :size="20" :stroke="2" />
    </span>
    <b class="font-medium text-fg">{{ title ?? $t('general.list_empty') }}</b>
    <span v-if="text">{{ text }}</span>
    <slot />
  </div>
</template>

<script setup>
import { IconInbox } from '@tabler/icons-vue'

defineProps({ icon: null, title: String, text: String })
</script>
