<template>
  <van-search v-model="modelValue" :placeholder="$t('search_placeholder')" />
</template>

<script setup>
const modelValue = defineModel()
</script>
