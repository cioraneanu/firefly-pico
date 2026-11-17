<template>
  <div ref="rootRef" class="mx-plist flex flex-col gap-3" :class="{ dragging: pull > 0 }" :style="listStyle" v-on="drag">
    <div v-if="pullable" class="mx-pull" role="status" :aria-label="refreshing ? $t('refreshing') : null">
      <span class="mx-spin" :class="{ idle: !refreshing }" :style="spinnerStyle" />
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
// Infinite list with pull to refresh: pull down at the top of .mx-body to refresh,
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
  // Observed against the page scroller (not the viewport, which it clips) so the next page starts loading well before the end
  observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && !props.loading && !props.finished && emit('load'), {
    root: scroller() ?? null,
    rootMargin: '600px',
  })
  observer.observe(sentinelRef.value)
}
// Load the first page on mount, without waiting for the observer
// (it does not fire while the page is hidden, e.g. a PWA resumed in the background)
onMounted(() => {
  observe()
  if (!props.finished && !props.loading) {
    emit('load')
  }
})
watch(sentinelRef, observe)
// After each page, observe again: if the end is still in view, the next page loads
watch(
  () => props.loading,
  (isLoading) => !isLoading && observe(),
)
onBeforeUnmount(() => observer?.disconnect())

// ----- pull to refresh (iOS style): the list follows the finger with resistance and the spinner fills in above it -----
// The gesture is axis-locked: a horizontal drag (swiping a row open) never pulls, and a pull blocks the row swipe,
// the native bounce and the browser's own pull-to-refresh.
const threshold = 64
const pull = ref(0)
const progress = computed(() => Math.min(1, pull.value / threshold))
const listStyle = computed(() => {
  const offset = pull.value || (refreshing.value ? 48 : 0)
  return offset ? { transform: `translateY(${offset}px)` } : null
})
const spinnerStyle = computed(() => (refreshing.value ? null : { opacity: progress.value, transform: `rotate(${progress.value * 270}deg)` }))

const scroller = () => rootRef.value?.closest('.mx-body, .mx-sh__b')

const drag = useTouchDrag({
  onStart: () => props.pullable && !refreshing.value && (scroller()?.scrollTop ?? 0) <= 0,
  onLock: (dx, dy) => dy > 0 && Math.abs(dy) > Math.abs(dx),
  // Rubber band: easy at first, harder the further it goes
  onMove: ({ dy }) => {
    const distance = Math.max(0, dy)
    pull.value = distance < 120 ? distance * 0.55 : 66 + (distance - 120) * 0.25
  },
  onEnd: ({ isDrag }) => {
    if (isDrag && pull.value >= threshold) {
      refreshing.value = true
      emit('refresh')
    }
    pull.value = 0
  },
})
</script>
