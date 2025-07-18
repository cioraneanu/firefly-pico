<template>
  <transition :name="transitionName">
    <div v-if="profileStore.isLoading" class="app-loading-background">
      <div class="app-loading flex-column flex-center">
        <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
        <div class="text-size-16">{{ profileStore.loadingMessage }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { IconRotate } from '@tabler/icons-vue'

const profileStore = useProfileStore()
const transitionName = computed(() => profileStore.showAnimations ? 'fade' : '')

</script>

<style></style>
