<template>
  <d-page :title="$t('settings.settings_title')" :description="$t('desktop.settings_description')" narrow>
    <div class="grid min-w-0 grid-cols-[13.75rem_minmax(0,1fr)] rounded-xl bg-card ring-1 ring-fg/10">
      <nav class="flex min-w-0 flex-col gap-0.5 border-r border-line p-3">
        <nuxt-link
          v-for="section in sections"
          :key="section.code"
          :to="`/settings/${section.code}`"
          :aria-current="section.code === active.code ? 'page' : undefined"
          :class="['flex h-9 items-center gap-2 rounded-lg px-2.5 font-medium transition-colors hover:bg-soft hover:text-fg', section.code === active.code ? 'bg-soft text-fg' : 'text-dim']"
        >
          <component :is="section.icon" :size="16" :stroke-width="2" />
          <span class="truncate">{{ $t(section.t) }}</span>
        </nuxt-link>
      </nav>
      <div class="flex min-w-0 flex-col gap-6 p-6">
        <h2 class="text-lg font-semibold tracking-[-0.01em]">{{ $t(active.t) }}</h2>
        <div class="-mt-1 h-px bg-line" />
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
