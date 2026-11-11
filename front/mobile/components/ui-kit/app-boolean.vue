<template>
  <button type="button" class="mx-tg" role="switch" :aria-checked="!!modelValue" :disabled="disabled" @click="onToggle">
    <span class="m">
      <b>{{ label }}</b>
      <span v-if="description">{{ description }}</span>
      <slot name="description" />
    </span>
    <span class="mx-sw" :class="{ on: !!modelValue }" />
  </button>
</template>

<script setup>
// Full-width toggle row (design: .mx-tg + .mx-sw).
const modelValue = defineModel()

defineProps({
  label: { type: String, default: '' },
  description: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const onToggle = () => {
  modelValue.value = !modelValue.value
}
</script>
