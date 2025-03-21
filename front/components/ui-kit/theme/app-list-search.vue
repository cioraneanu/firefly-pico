<template>
  <van-search v-model="modelValue" :placeholder="$t('search')" />
</template>

<script setup>
const modelValue = defineModel()
</script>
