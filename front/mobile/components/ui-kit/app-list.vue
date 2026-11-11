<template>
  <div ref="rootRef" class="flex flex-col gap-3" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @touchend="onTouchEnd">
    <div v-if="pullable && (pullHeight > 0 || refreshing)" class="mx-pull" :class="{ idle: !refreshing }" :style="{ height: `${refreshing ? 40 : pullHeight}px` }" role="status">
      <template v-if="refreshing">
        <span class="mx-spin" />
        <span>{{ $t('refreshing') }}</span>
      </template>
      <app-icon v-else :icon="IconArrowDown" :size="18" :stroke="2" :style="{ transform: `rotate(${pullHeight >= threshold ? 180 : 0}deg)` }" />
    </div>
    <slot />
    <div v-if="!finished" ref="sentinelRef" class="h-px" />
    <div v-if="loading && !refreshing" class="mx-more" role="status">
      <span class="mx-spin" />
      <span>{{ $t('loading') }}</span>
    </div>
  </div>
</template>

<script setup>
import { IconArrowDown } from '@tabler/icons-vue'

// Replaces van-pull-refresh + van-list: pull down at the top of .mx-body to refresh,
// and `load` fires whenever the end of the list scrolls into view until `finished`.
const refreshing = defineModel('refreshing', { type: Boolean, default: false })

const props = defineProps({
  loading: { type: Boolean, default: false },
  finished: { type: Boolean, default: false },
  pullable: { type: Boolean, default: true },
})

const emit = defineEmits(['load', 'refresh'])

const rootRef = ref(null)
const sentinelRef = ref(null)

let observer = null
const observe = () => {
  observer?.disconnect()
  if (!sentinelRef.value) {
    return
  }
  observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && !props.loading && !props.finished && emit('load'), { rootMargin: '200px' })
  observer.observe(sentinelRef.value)
}
onMounted(observe)
watch(sentinelRef, observe)
// After each page, observe again: if the end is still in view, the next page loads
watch(
  () => props.loading,
  (isLoading) => !isLoading && observe(),
)
onBeforeUnmount(() => observer?.disconnect())

// ----- pull to refresh -----
const threshold = 56
const pullHeight = ref(0)
let startY = null
const scroller = () => rootRef.value?.closest('.mx-body')

const onTouchStart = (event) => {
  startY = props.pullable && !refreshing.value && (scroller()?.scrollTop ?? 0) <= 0 ? event.touches[0].clientY : null
}
const onTouchMove = (event) => {
  if (startY !== null) {
    pullHeight.value = Math.min(72, Math.max(0, (event.touches[0].clientY - startY) * 0.5))
  }
}
const onTouchEnd = () => {
  if (startY !== null && pullHeight.value >= threshold) {
    refreshing.value = true
    emit('refresh')
  }
  startY = null
  pullHeight.value = 0
}
</script>
