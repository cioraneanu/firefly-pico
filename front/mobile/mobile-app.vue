<template>
  <div class="mx mx-app" :class="{ kb: isKeyboardVisible }" :data-theme="profileStore.darkTheme ? 'dark' : 'light'">
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
const { isKeyboardVisible } = useKeyboard()

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
  ],
})
</script>
