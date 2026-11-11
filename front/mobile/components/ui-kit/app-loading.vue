<template>
  <Teleport to="#mx-portal" defer>
    <!-- Blocks touches while a request is in flight (no double submits), but only shows once it takes a while -->
    <div v-if="loadingStore.isLoadingDelayed" class="mx-loading" :class="{ shown: isShown && loadingStore.isLoading, blocking: loadingStore.isLoading, anim: profileStore.showAnimations }">
      <div class="mx-ov dim" aria-hidden="true" />
      <div class="mx-block" role="status">
        <span class="mx-spin lg" />
        <span>{{ loadingStore.loadingMessage }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useLoadingStore } from '~/core/stores/loadingStore'

// Blocking load (design: .mx-block over a dimmed page). Quick requests never flash it.
const profileStore = useProfileStore()
const loadingStore = useLoadingStore()

const isShown = ref(false)
let timer = null
watch(
  () => loadingStore.isLoadingDelayed,
  (isLoading) => {
    clearTimeout(timer)
    isShown.value = false
    if (isLoading) {
      timer = setTimeout(() => (isShown.value = true), 400)
    }
  },
)
onBeforeUnmount(() => clearTimeout(timer))
</script>
