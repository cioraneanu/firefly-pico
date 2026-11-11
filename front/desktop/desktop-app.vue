<template>
  <div class="d-app flex">
    <d-sidebar v-if="isSidebarOpen" />
    <div class="flex min-h-screen min-w-0 flex-1 flex-col bg-bg">
      <d-header v-model:sidebar="isSidebarOpen" />
      <NuxtPage :page-key="(route) => route.matched[0]?.path" />
    </div>
    <d-confirm />
    <d-toaster />
  </div>
</template>

<script setup>
import { useLocalStorage, useMagicKeys, whenever } from '@vueuse/core'
import '~/desktop/styles/desktop.css'
import UIUtils from '~/core/utils/UIUtils'
import RouteConstants from '~/core/constants/RouteConstants'

UIUtils.ui = DesktopUI

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap' },
  ],
})

const profileStore = useProfileStore()
const portal = Object.assign(document.createElement('div'), { id: 'd-portal' })
document.body.append(portal)
watchEffect(() => (portal.className = profileStore.darkTheme ? 'd-portal van-theme-dark' : 'd-portal'))
onBeforeUnmount(() => portal.remove())

const isSidebarOpen = useLocalStorage('desktopSidebarOpen', true)
const { n } = useMagicKeys()

const isTyping = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.querySelector('[aria-modal]')
whenever(n, () => !isTyping() && navigateTo(RouteConstants.ROUTE_TRANSACTION_ID))
</script>
