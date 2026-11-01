<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
    <slot />
  </form>
</template>

<script setup>
const emit = defineEmits(['submit', 'failed'])

const validators = new Set()
provide('d-form', { add: (fn) => validators.add(fn), remove: (fn) => validators.delete(fn) })

const submit = () => ([...validators].map((validate) => validate()).every(Boolean) ? emit('submit') : emit('failed'))

defineExpose({ submit })
</script>
