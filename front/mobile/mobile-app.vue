<template>
  <div class="mx mx-app" :class="{ kb: isKeyboardVisible }" :style="keyboardStyle" :data-theme="profileStore.darkTheme ? 'dark' : 'light'">
    <NuxtLayout>
      <NuxtPage :transition="profileStore.showAnimations && { name: isBack ? 'mx-back' : 'mx-page' }" :page-key="(route) => route.meta.pageKey ?? 0" />
    </NuxtLayout>
    <div id="mx-portal" class="mx-portal" />
    <app-feedback-host />
    <app-loading />
  </div>
</template>

<script setup>
import { useEventListener } from '@vueuse/core'
import UIUtils from '~/core/utils/UIUtils'
import MobileUI from '~/mobile/utils/MobileUI'
import { formNavigation } from '~/core/composables/useForm'

UIUtils.ui = MobileUI

const profileStore = useProfileStore()

// Pages change with the depth zoom in mx-app-kit.css (.mx-page-*), played in reverse (.mx-back-*) on history back.
// Each new path mounts a new page, except a form moving to the URL of the item it just created (useForm): it stays as it is.
const router = useRouter()
const isBack = ref(false)
let popDirection = ''
let pageCount = 0
router.options.history.listen((to, from, { direction }) => (popDirection = direction))
router.beforeEach((to, from) => {
  isBack.value = popDirection === 'back'
  popDirection = ''
  const isSamePage = to.path === from.path || formNavigation.keepPage || (to.meta.key && to.meta.key === from.meta.key)
  formNavigation.keepPage = false
  to.meta.pageKey = isSamePage ? from.meta.pageKey : ++pageCount
})

const { isKeyboardVisible, visualViewportHeight, visualViewportOffsetTop } = useKeyboard()
// iOS does not resize the page for the keyboard, it pans it: pin the app to the visible area so sheets and the save button sit above the keyboard
const keyboardStyle = computed(() => (isKeyboardVisible.value ? { '--app-h': `${visualViewportHeight.value}px`, '--app-y': `${visualViewportOffsetTop.value}px` } : null))

// The browser scrolls to a focused field before the app shrinks above the keyboard: center it in what is left (the amount field places itself)
const centerFocusedField = () => {
  const field = document.activeElement?.closest('.mx-f')
  if (isKeyboardVisible.value && field && !field.querySelector('.mx-amt-in')) field.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
watch(isKeyboardVisible, centerFocusedField, { flush: 'post' })
useEventListener(document, 'focusin', centerFocusedField)

// iOS Safari only shows :active press states when the page listens to touches
onMounted(() => document.addEventListener('touchstart', () => {}, { passive: true }))
</script>
