<template>
  <div class="mx-tools">
    <slot name="left" />
    <label class="mx-search">
      <app-icon :icon="IconSearch" :size="16" :stroke="2" />
      <input
        v-model="modelValue"
        type="search"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="search"
        :placeholder="placeholder ?? $t('search_placeholder')"
        :aria-label="$t('search_placeholder')"
        @keydown.enter="$event.target.blur()"
      />
      <button v-if="modelValue" type="button" class="mx-ib sm" style="margin-right: -8px" :aria-label="$t('clear')" @click="modelValue = ''">
        <app-icon :icon="IconX" :size="14" :stroke="2" />
      </button>
    </label>
    <slot name="right" />
  </div>
</template>

<script setup>
import { IconSearch, IconX } from '@tabler/icons-vue'

const modelValue = defineModel({ type: String, default: '' })
defineProps({
  placeholder: { type: String, default: null },
})
</script>
