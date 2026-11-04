<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <app-loading />
</template>

<script setup>
import UIUtils from '~/core/utils/UIUtils'
import MobileUI from '~/mobile/utils/MobileUI'

UIUtils.ui = MobileUI
</script>
