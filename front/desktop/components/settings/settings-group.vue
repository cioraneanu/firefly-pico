<template>
  <section class="flex flex-col gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
    <div v-if="title">
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p v-if="description" class="mt-0.5 text-[13px] text-dim">{{ description }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({ title: String, description: String })
</script>
