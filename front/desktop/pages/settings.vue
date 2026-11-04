<template>
  <d-page :title="$t('settings.settings_title')" :description="$t('desktop.settings_description')" narrow>
    <div class="grid min-w-0 grid-cols-[13.75rem_minmax(0,1fr)] rounded-xl bg-card ring-1 ring-fg/10">
      <nav class="flex flex-col gap-0.5 border-r border-line p-3">
        <nuxt-link
          v-for="section in sections"
          :key="section.code"
          :to="`/settings/${section.code}`"
          :class="['flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-soft/70', section.code === active.code && 'bg-soft font-medium']"
        >
          <component :is="section.icon" :size="16" :class="section.code === active.code ? 'text-fg' : 'text-dim'" />
          <span class="truncate">{{ $t(section.t) }}</span>
        </nuxt-link>
      </nav>
      <div class="flex min-w-0 flex-col gap-6 p-6">
        <div>
          <h2 class="text-base font-semibold">{{ $t(active.t) }}</h2>
        </div>
        <component :is="component" :key="active.code" />
      </div>
    </div>
  </d-page>
</template>

<script setup>
import sections from '~/desktop/settings-sections'

const route = useRoute()
const active = computed(() => sections.find((section) => section.code === route.meta.section))
const component = computed(() => defineAsyncComponent(active.value.component))
</script>
