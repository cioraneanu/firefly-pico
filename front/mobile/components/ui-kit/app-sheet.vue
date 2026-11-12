<template>
  <Teleport to="#mx-portal" defer>
    <transition name="mx-fd">
      <button v-if="show" type="button" class="mx-ov" :class="{ 'mx-ov--f': full, dragging: isDragging }" :style="overlayStyle" tabindex="-1" :aria-label="$t('close')" @click="close" />
    </transition>
    <transition name="mx-sh">
      <div
        v-if="show"
        ref="sheetRef"
        class="mx-sh"
        :class="[{ 'mx-sh--f': full, 'mx-sh--s': searchable, dragging: isDragging }, sheetClass]"
        :style="sheetStyle"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <div class="mx-sh__h">
          <h2>{{ title }}</h2>
          <slot name="header-right" />
          <button type="button" class="mx-ib sm" :aria-label="$t('close')" @click="close">
            <app-icon :icon="IconX" :size="16" :stroke="2" />
          </button>
        </div>
        <p v-if="description" class="mx-sh__d">{{ description }}</p>

        <div v-if="searchable" class="mx-sh__s">
          <label class="mx-search">
            <app-icon :icon="IconSearch" :size="16" :stroke="2" />
            <input
              v-model="search"
              type="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              enterkeyhint="search"
              :placeholder="searchPlaceholder ?? $t('search_placeholder')"
              :aria-label="$t('search_placeholder')"
              @keydown.enter="$event.target.blur()"
            />
            <button v-if="search" type="button" class="mx-ib sm" style="margin-right: -8px" :aria-label="$t('clear')" @click="search = ''">
              <app-icon :icon="IconX" :size="14" :stroke="2" />
            </button>
          </label>
        </div>

        <slot name="top" />

        <div class="mx-sh__b" :class="bodyClass">
          <slot />
        </div>

        <div v-if="$slots.footer" class="mx-sh__f">
          <slot name="footer" />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { IconSearch, IconX } from '@tabler/icons-vue'

// Bottom sheet of the mobile kit (design: .mx-sh). Teleports into #mx-portal so it keeps the .mx tokens.
// Like an iOS sheet: drag it down to close (from anywhere while its list is scrolled to the top), it rubber-bands when pulled up.
const show = defineModel('show', { type: Boolean, default: false })
const search = defineModel('search', { type: String, default: '' })

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: null },
  full: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: null },
  sheetClass: { default: null },
  bodyClass: { default: null },
})

const emit = defineEmits(['close'])

const close = () => {
  show.value = false
  emit('close')
}

// ----- drag to dismiss -----
const offset = ref(0)
const isDragging = ref(false)
watch(show, (isShown) => isShown && (offset.value = 0))

// Searching keeps the sheet at the height it had, so the header does not jump down as the results shrink
const sheetRef = ref(null)
const searchHeight = ref(null)
watch(show, () => (searchHeight.value = null))
watch(search, (value) => value && !searchHeight.value && (searchHeight.value = sheetRef.value?.offsetHeight ?? null))

const sheetStyle = computed(() => ({ '--dy': offset.value ? `${offset.value}px` : null, minHeight: searchHeight.value ? `min(${searchHeight.value}px, 100%)` : null }))
// Dims through --ov (not opacity), so the leave fade still runs after a drag-to-close
const overlayStyle = computed(() => (offset.value > 0 ? { '--ov': Math.max(0, 1 - offset.value / 400) } : null))

let touch = null
const canScroll = (element) => !!element && element.scrollHeight > element.clientHeight + 1

const onTouchStart = (event) => {
  const { clientX, clientY } = event.touches[0]
  touch = event.touches.length === 1 ? { x: clientX, y: clientY, lastY: clientY, lastTime: event.timeStamp, velocity: 0, scroller: event.target.closest('.mx-sh__b'), axis: null } : null
}

const onTouchMove = (event) => {
  if (!touch) {
    return
  }
  const { clientX, clientY } = event.touches[0]
  const dx = clientX - touch.x
  const dy = clientY - touch.y
  if (!touch.axis) {
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
      return
    }
    const isAtTop = (touch.scroller?.scrollTop ?? 0) <= 0
    const isVertical = Math.abs(dy) > Math.abs(dx)
    // Down: drag the sheet once its list is at the top. Up: rubber-band when there is nothing to scroll.
    const isDrag = isVertical && (dy > 0 ? isAtTop : !canScroll(touch.scroller))
    touch.axis = isDrag && event.cancelable ? 'drag' : 'none'
    if (touch.axis === 'drag') {
      isDragging.value = true
      if (dy > 0) {
        document.activeElement?.blur?.()
      }
    }
  }
  if (touch.axis !== 'drag') {
    return
  }
  event.preventDefault()
  const elapsed = event.timeStamp - touch.lastTime
  if (elapsed > 0) {
    touch.velocity = (clientY - touch.lastY) / elapsed
  }
  touch.lastY = clientY
  touch.lastTime = event.timeStamp
  offset.value = dy > 0 ? dy : -Math.sqrt(-dy) * 2.5
}

const onTouchEnd = async () => {
  const isClosing = touch?.axis === 'drag' && (offset.value > 140 || (offset.value > 24 && touch.velocity > 0.45))
  if (touch?.axis === 'drag') {
    isDragging.value = false
    offset.value = isClosing ? offset.value : 0
  }
  touch = null
  // A downward flick closes it, and so does a slow drag past 140px. After the render that drops .dragging: a leaving element is not patched, so it would keep `transition: none` and vanish
  if (isClosing) {
    await nextTick()
    close()
  }
}
</script>
