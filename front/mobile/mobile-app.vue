<template>
  <div class="mx mx-app" :class="{ kb: isKeyboardVisible }" :style="keyboardStyle" :data-theme="profileStore.darkTheme ? 'dark' : 'light'">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <div id="mx-portal" class="mx-portal" />
    <app-feedback-host />
    <app-loading />
  </div>
</template>

<script setup>
import UIUtils from '~/core/utils/UIUtils'
import MobileUI from '~/mobile/utils/MobileUI'

UIUtils.ui = MobileUI

const profileStore = useProfileStore()
const { isKeyboardVisible, visualViewportHeight, visualViewportOffsetTop } = useKeyboard()
// iOS does not resize the page for the keyboard, it pans it: pin the app to the visible area so sheets and the save button sit above the keyboard
const keyboardStyle = computed(() => (isKeyboardVisible.value ? { '--app-h': `${visualViewportHeight.value}px`, '--app-y': `${visualViewportOffsetTop.value}px` } : null))

// iOS Safari only shows :active press states when the page listens to touches
onMounted(() => document.addEventListener('touchstart', () => {}, { passive: true }))

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
  ],
})
</script>
