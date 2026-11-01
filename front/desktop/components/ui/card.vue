<template>
  <section class="flex min-w-0 flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-fg/10">
    <div v-if="title || $slots.actions" class="flex items-start justify-between gap-2 px-4">
      <div class="min-w-0">
        <h2 class="text-base font-medium">{{ title }}</h2>
        <p v-if="description" class="text-sm text-dim">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <div :class="!flush && 'px-4'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="-mb-4 flex flex-wrap items-center gap-2 rounded-b-xl border-t border-line bg-soft/50 p-4">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup>
defineProps({ title: String, description: String, flush: Boolean })
</script>
