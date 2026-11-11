<template>
  <Teleport to="#mx-portal" defer>
    <transition name="mx-fd">
      <button v-if="show" type="button" class="mx-ov" :class="{ 'mx-ov--f': full }" :aria-label="$t('close')" @click="close" />
    </transition>
    <transition name="mx-sh">
      <div v-if="show" class="mx-sh" :class="[{ 'mx-sh--f': full }, sheetClass]" :style="sheetStyle" role="dialog" aria-modal="true" :aria-label="title">
        <div class="mx-sh__h" @pointerdown="onDragStart" @pointermove="onDragMove" @pointerup="onDragEnd" @pointercancel="onDragEnd">
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
            <input v-model="search" type="search" :placeholder="searchPlaceholder ?? $t('search_placeholder')" :aria-label="$t('search_placeholder')" />
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
// Drag the header down to close.
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

const drag = ref(null)
const sheetStyle = computed(() => (drag.value?.dy ? { transform: `translateY(${drag.value.dy}px)`, transition: 'none' } : null))

const onDragStart = (event) => {
  if (event.target.closest('button')) {
    return
  }
  drag.value = { y: event.clientY, dy: 0 }
  event.currentTarget.setPointerCapture?.(event.pointerId)
}
const onDragMove = (event) => {
  if (drag.value) {
    drag.value = { ...drag.value, dy: Math.max(0, event.clientY - drag.value.y) }
  }
}
const onDragEnd = () => {
  if (drag.value?.dy > 90) {
    close()
  }
  drag.value = null
}
</script>
