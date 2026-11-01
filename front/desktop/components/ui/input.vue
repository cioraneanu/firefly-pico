<template>
  <label
    :class="[
      'flex h-8 w-full min-w-0 cursor-text items-center rounded-lg border bg-transparent transition-shadow focus-within:ring-3 dark:bg-field/30',
      isInvalid ? 'border-danger ring-danger/20 focus-within:ring-danger/20' : 'border-field focus-within:border-ring focus-within:ring-ring/50',
    ]"
  >
    <component :is="icon" v-if="icon" :size="16" class="ml-2.5 text-dim" />
    <span v-if="prefix" class="ml-2.5 text-dim">{{ prefix }}</span>
    <input ref="input" v-model="model" :type :placeholder :step :min :autofocus :disabled class="h-full min-w-0 flex-1 px-2.5 text-sm tabular-nums" />
    <span v-if="suffix" class="mr-2.5 text-dim">{{ suffix }}</span>
    <d-button v-if="clearable && model" variant="ghost" size="icon-xs" :icon="IconX" class="mr-1 text-dim" :aria-label="$t('filters.clear')" @click.prevent="model = ''" />
    <slot />
  </label>
</template>

<script setup>
import { IconX } from '@tabler/icons-vue'

const model = defineModel()
const props = defineProps({
  type: { default: 'text' },
  icon: [Object, Function],
  prefix: String,
  suffix: String,
  placeholder: String,
  step: [String, Number],
  min: [String, Number],
  clearable: Boolean,
  autofocus: Boolean,
  disabled: Boolean,
  invalid: Boolean,
})

const field = inject('d-field', null)
const isInvalid = computed(() => props.invalid || !!field?.error.value)
const input = ref(null)

defineExpose({ focus: () => input.value?.focus() })
</script>
