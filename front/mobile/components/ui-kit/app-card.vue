<template>
  <h2 v-if="section" class="mx-sec">
    <span>{{ section }}</span>
    <slot name="section-right" />
  </h2>
  <section class="mx-card" :class="{ pad }">
    <div v-if="title || $slots.title || $slots.actions" class="mx-card__h">
      <div class="min-w-0">
        <slot name="title">
          <h2 class="mx-card__t">{{ title }}</h2>
          <p v-if="description" class="mx-card__d">{{ description }}</p>
        </slot>
      </div>
      <slot name="actions" />
    </div>
    <div v-if="form" class="mx-form">
      <slot />
    </div>
    <div v-else-if="title || $slots.title" class="mx-card__c">
      <slot />
    </div>
    <slot v-else />
  </section>
</template>

<script setup>
// Card of the mobile kit (design: .mx-card). `form` wraps the content in .mx-form (fields stacked, 16px gap);
// `section` adds the small grey heading above the card (.mx-sec).
defineProps({
  title: { type: String, default: null },
  description: { type: String, default: null },
  section: { type: String, default: null },
  form: { type: Boolean, default: true },
  pad: { type: Boolean, default: false },
})
</script>
