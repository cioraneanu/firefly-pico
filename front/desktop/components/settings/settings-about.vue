<template>
  <d-settings-group>
    <div class="flex flex-wrap items-center gap-3">
      <img src="/logo.svg" alt="" class="size-10 shrink-0">
      <div>
        <b class="font-semibold">Firefly Pico</b>
        <p class="text-[13px] text-dim">{{ $t('settings.version') }}: {{ appStore.currentAppVersion }}</p>
      </div>
      <d-button v-if="appStore.isNewVersionAvailable" variant="primary" size="sm" :icon="IconDownload" class="ml-auto" @click="open"
        >{{ $t('settings.new_version_available') }}: {{ appStore.latestAppVersion }}</d-button
      >
    </div>
  </d-settings-group>

  <d-settings-group :title="$t('about.credits')">
    <div class="flex flex-col gap-1 text-[13px] text-dim [&_a]:text-fg [&_a]:underline">
      <div v-html="$t('about.developed_by', { url: REPO_URL })" />
      <div v-for="key in credits" :key="key" v-html="$t(key)" />
    </div>
  </d-settings-group>
</template>

<script setup>
import { IconDownload } from '@tabler/icons-vue'
import { REPO_URL } from '~/core/constants/Constants'

const appStore = useAppStore()
const open = () => window.open(REPO_URL, '_blank')

const credits = [
  'about.using_laravel_nuxt',
  'about.consuming_firefly',
  'about.exchange_rate_api',
  'about.iconpacks_tabler',
  'about.iconpacks_fluent',
  'about.iconpacks_circle_avatar',
  'about.iconpacks_svg_repo',
  'about.iconpacks_freepik',
  'about.illustrations_undraw',
]
</script>
