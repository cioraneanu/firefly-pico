<template>
  <d-select v-model="model" :options :get-label="(option) => (option.t ? $t(option.t) : option.name)" :searchable="false" :clearable />
</template>

<script setup>
const model = defineModel()
defineProps({ options: Array, clearable: Boolean })
</script>
