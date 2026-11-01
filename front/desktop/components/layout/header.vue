<template>
  <header class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-line bg-bg/90 px-4 backdrop-blur">
    <d-button variant="ghost" size="icon-sm" :icon="IconLayoutSidebar" class="-ml-1" :aria-label="$t('desktop.toggle_sidebar')" @click="sidebar = !sidebar" />
    <span class="mx-2 h-4 w-px bg-line" />
    <nav class="flex min-w-0 items-center gap-1.5 text-dim">
      <nuxt-link :to="RouteConstants.ROUTE_DASHBOARD" class="truncate transition-colors hover:text-fg">Firefly Pico</nuxt-link>
      <template v-if="active">
        <icon-chevron-right :size="14" />
        <nuxt-link :to="active.to" :class="['truncate transition-colors hover:text-fg', !crumb && 'text-fg']">{{ active.label }}</nuxt-link>
      </template>
      <template v-if="crumb">
        <icon-chevron-right :size="14" />
        <span class="truncate text-fg">{{ crumb }}</span>
      </template>
    </nav>
    <div class="ml-auto flex items-center gap-2">
      <d-button variant="ghost" size="icon" :icon="profileStore.darkTheme ? IconSun : IconMoon" :aria-label="$t('settings.ui.theme')" @click="toggleTheme" />
    </div>
  </header>
</template>

<script setup>
import { IconChevronRight, IconLayoutSidebar, IconMoon, IconSun } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

const sidebar = defineModel('sidebar')
const profileStore = useProfileStore()
const route = useRoute()
const { active } = useDesktopNav()
const { t } = useI18n()

const crumb = computed(() => route.meta.crumb && t(route.meta.crumb))

const toggleTheme = () => {
  profileStore.darkTheme = !profileStore.darkTheme
  profileStore.writeProfile()
}
</script>
