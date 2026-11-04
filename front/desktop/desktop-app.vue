<template>
  <div class="d-app flex">
    <d-sidebar v-if="isSidebarOpen" />
    <div :class="['my-2 mr-2 flex min-h-[calc(100vh-1rem)] min-w-0 flex-1 flex-col rounded-xl bg-bg shadow-sm', !isSidebarOpen && 'ml-2']">
      <d-header v-model:sidebar="isSidebarOpen" />
      <NuxtPage :page-key="(route) => route.matched[0]?.path" />
    </div>
    <d-confirm />
    <d-toaster />
    <d-loading-bar />
  </div>
</template>

<script setup>
import { useLocalStorage, useMagicKeys, whenever } from '@vueuse/core'
import '~/desktop/styles/desktop.css'
import UIUtils from '~/core/utils/UIUtils'
import RouteConstants from '~/core/constants/RouteConstants'

UIUtils.ui = DesktopUI

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
