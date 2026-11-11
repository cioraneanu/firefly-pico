<template>
  <div class="mx-tile">
    <div v-if="title" class="h">
      <span>{{ title }}</span>
    </div>
    <b v-if="subtitle" class="mx-money">{{ subtitle }}</b>
  </div>
</template>

<script setup>
// Small stat (design: .mx-tile): muted caption above a bold value. Put several in a .mx-tiles grid.
defineProps({
  title: { type: String },
  subtitle: { type: String },
})
</script>
