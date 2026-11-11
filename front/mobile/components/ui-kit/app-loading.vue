<template>
  <Teleport to="#mx-portal" defer>
    <transition :name="profileStore.showAnimations ? 'mx-fd' : ''">
      <div v-if="loadingStore.isLoadingDelayed">
        <div class="mx-ov dim" aria-hidden="true" />
        <div class="mx-block" role="status">
          <span class="mx-spin lg" />
          <span>{{ loadingStore.loadingMessage }}</span>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { useLoadingStore } from '~/core/stores/loadingStore'

// Blocking load (design: .mx-block over a dimmed page)
const profileStore = useProfileStore()
const loadingStore = useLoadingStore()
</script>
