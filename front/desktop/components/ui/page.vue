<template>
  <main :class="['flex w-full min-w-0 flex-col gap-6 px-10 pb-12 pt-8', narrow && 'max-w-300']">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-[-0.025em]">{{ title }}</h1>
        <p v-if="description" class="mt-1 text-sm text-dim">{{ description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <!-- min-h-96 keeps the loading pill at its 5.25rem cap while the content is still short -->
    <d-loading class="flex min-h-96 flex-col gap-6">
      <slot />
    </d-loading>
  </main>
</template>

<script setup>
defineProps({ title: String, description: String, narrow: Boolean })
</script>
