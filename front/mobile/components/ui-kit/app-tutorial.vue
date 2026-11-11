<template>
  <slot :open="onOpen">
    <button type="button" class="mx-help" :aria-label="title" aria-haspopup="dialog" @click.stop.prevent="onOpen">
      <app-icon :icon="IconHelpCircle" :size="14" :stroke="2" />
    </button>
  </slot>

  <app-sheet v-model:show="showPopover" :title="title">
    <div class="mx-prose" v-html="body" />
    <template #footer>
      <button type="button" class="mx-btn pri" @click="showPopover = false">{{ $t('kit.got_it') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
import { IconHelpCircle } from '@tabler/icons-vue'

// Help: a small (?) button that opens a sheet with the explanation (design: MX-HelpSheet).
// The default slot replaces the button: <app-tutorial v-slot="{ open }"><button @click="open">…</button></app-tutorial>
defineProps({
  title: {},
  body: {},
})

const showPopover = ref(false)
const onOpen = () => (showPopover.value = true)
</script>
