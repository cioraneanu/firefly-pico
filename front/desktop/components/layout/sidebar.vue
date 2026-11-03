<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col">
    <div class="flex flex-col gap-2 p-2">
      <nuxt-link :to="RouteConstants.ROUTE_DASHBOARD" class="flex h-12 items-center gap-2 rounded-lg p-2 transition-colors hover:bg-soft">
        <d-tile primary><icon-coins :size="16" /></d-tile>
        <span class="grid min-w-0 leading-tight">
          <b class="truncate text-sm font-semibold">Firefly Pico</b>
          <span class="truncate text-xs text-dim">{{ host }}</span>
        </span>
      </nuxt-link>
      <div class="flex gap-1.5">
        <d-button variant="primary" :icon="IconPlus" class="flex-1 justify-start" :to="RouteConstants.ROUTE_TRANSACTION_ID">
          {{ $t('new_transaction') }}
          <kbd class="ml-auto rounded-sm bg-on-primary/20 px-1.5 text-xs">N</kbd>
        </d-button>
        <d-button v-if="appStore.llmIsConfigured" variant="ghost" size="icon" :icon="IconMicrophone" :to="RouteConstants.ROUTE_RAMBLE" :aria-label="$t('transaction.assistant_ramble_title')" />
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto">
      <div v-for="group in groups" :key="group.label" class="flex flex-col p-2">
        <p class="flex h-8 items-center px-2 text-xs font-medium text-fg/70">{{ group.label }}</p>
        <nuxt-link
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :class="['flex h-8 items-center gap-2 rounded-md px-2 transition-colors hover:bg-soft', item === active && 'bg-soft font-medium']"
        >
          <component :is="item.icon" :size="16" />
          <span class="truncate">{{ item.label }}</span>
          <span v-if="item.to === RouteConstants.ROUTE_SETTINGS && appStore.isNewVersionAvailable" class="ml-auto size-1.5 rounded-full bg-info" />
        </nuxt-link>
      </div>
    </nav>

    <div class="flex flex-col gap-1 p-2">
      <button type="button" class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-soft" @click="sync">
        <icon-refresh :size="16" :class="isSyncing && 'd-spin'" />
        <span class="truncate">{{ syncLabel }}</span>
        <span class="ml-auto size-1.5 rounded-full bg-success" />
      </button>
      <d-profile-menu />
    </div>
  </aside>
</template>

<script setup>
import { IconCoins, IconMicrophone, IconPlus, IconRefresh } from '@tabler/icons-vue'
import { formatTimeAgo } from '@vueuse/core'
import RouteConstants from '~/core/constants/RouteConstants'

const appStore = useAppStore()
const { groups, active } = useDesktopNav()
const { t } = useI18n()

const isSyncing = ref(false)
const host = computed(() => appStore.picoBackendURL?.replace(/^\w+:\/\//, '').split('/')[0])
const syncLabel = computed(() =>
  isSyncing.value ? t('settings.setup.fetching') : `${t('settings.setup.last_sync')}: ${appStore.lastSync ? formatTimeAgo(new Date(appStore.lastSync)) : t('not_set')}`,
)

const sync = async () => {
  isSyncing.value = true
  await appStore.syncEverything()
  isSyncing.value = false
}
</script>
