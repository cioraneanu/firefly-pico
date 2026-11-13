<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-side">
    <div class="flex flex-col gap-2 p-2">
      <nuxt-link :to="RouteConstants.ROUTE_DASHBOARD" class="flex h-12 items-center gap-2 rounded-md p-2 transition-colors hover:bg-soft">
        <img src="/logo.svg" alt="" class="size-8 shrink-0" />
        <span class="grid min-w-0 leading-tight">
          <b class="truncate text-sm font-semibold">Firefly Pico</b>
          <span class="truncate text-xs text-dim">{{ host }}</span>
        </span>
      </nuxt-link>
      <div class="flex gap-1.5">
        <d-button variant="primary" :icon="IconPlus" class="min-w-0 flex-1 justify-start pl-2.5 pr-1.5" :to="RouteConstants.ROUTE_TRANSACTION_ID" aria-keyshortcuts="N">
          {{ $t('new_transaction') }}
          <kbd class="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-on-primary/18 px-1 text-xs font-medium">N</kbd>
        </d-button>
        <d-button v-if="appStore.llmIsConfigured" variant="ghost" size="icon" :icon="IconMicrophone" :to="RouteConstants.ROUTE_RAMBLE" :aria-label="$t('transaction.assistant_ramble_title')" />
      </div>
      <button
        type="button"
        class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border border-field bg-bg pl-2.5 pr-1.5 text-dim transition-colors hover:bg-soft hover:text-fg dark:bg-field/30"
        :aria-keyshortcuts="shortcut"
        @click="isCommandOpen = true"
      >
        <icon-search :size="15" />
        <span class="flex-1 truncate text-left">{{ $t('desktop.command.placeholder') }}</span>
        <kbd class="grid h-5 place-items-center rounded-sm bg-fg/8 px-1 text-xs font-medium">{{ shortcut }}</kbd>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto">
      <div v-for="group in groups" :key="group.label" class="flex flex-col gap-1 p-2">
        <p class="-mb-1 flex h-8 items-center px-2 text-xs font-medium text-fg/70">{{ group.label }}</p>
        <nuxt-link
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :class="['flex h-8 items-center gap-2 rounded-md p-2 transition-colors hover:bg-soft', item === active && 'bg-soft font-medium']"
        >
          <component :is="item.icon" :size="16" class="opacity-90" />
          <span class="truncate">{{ item.label }}</span>
          <span v-if="item.count" class="ml-auto text-xs tabular-nums text-dim">{{ item.count }}</span>
          <span v-if="item.to === RouteConstants.ROUTE_SETTINGS && appStore.isNewVersionAvailable" class="ml-auto size-1.5 rounded-full bg-info" />
        </nuxt-link>
      </div>
    </nav>

    <div class="flex flex-col gap-1 p-2">
      <button type="button" class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-soft" aria-live="polite" @click="sync">
        <icon-refresh :size="16" :class="isSyncing && 'd-spin'" />
        <span class="truncate">{{ syncLabel }}</span>
        <span class="ml-auto size-1.5 rounded-full bg-success" />
      </button>
      <d-profile-menu />
    </div>
  </aside>
</template>

<script setup>
import { IconMicrophone, IconPlus, IconRefresh, IconSearch } from '@tabler/icons-vue'
import { formatTimeAgo } from '@vueuse/core'
import RouteConstants from '~/core/constants/RouteConstants'
import { commandPaletteShortcut as shortcut, isCommandPaletteOpen as isCommandOpen } from '~/desktop/composables/useCommandPalette'

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
