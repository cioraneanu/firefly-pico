<template>
  <main :class="['flex w-full min-w-0 flex-col gap-5 p-6', narrow && 'max-w-300']">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="mt-0.5 text-sm text-dim">{{ description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </main>
</template>

<script setup>
defineProps({ title: String, description: String, narrow: Boolean })
</script>
