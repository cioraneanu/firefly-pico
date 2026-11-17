<template>
  <Teleport to="#d-portal">
    <Transition name="d-dialog">
      <div v-if="isCommandPaletteOpen" class="fixed inset-0 z-[70]">
        <div class="d-backdrop fixed inset-0 bg-black/10 backdrop-blur-xs dark:bg-black/50" @click="isCommandPaletteOpen = false" />
        <div class="pointer-events-none relative flex justify-center px-4 pt-[12vh]">
          <div
            ref="panel"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('desktop.command.placeholder')"
            class="d-dialog-panel pointer-events-auto flex w-full max-w-140 flex-col overflow-hidden rounded-xl bg-pop shadow-[0_16px_48px_-12px_rgb(0_0_0/0.25)] ring-1 ring-fg/10"
          >
            <label class="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-3.5">
              <icon-search :size="16" class="shrink-0 text-dim" />
              <input
                v-model="query"
                autofocus
                role="combobox"
                aria-expanded="true"
                autocomplete="off"
                spellcheck="false"
                :placeholder="$t('desktop.command.placeholder')"
                class="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
                @keydown.down.prevent="move(1)"
                @keydown.up.prevent="move(-1)"
                @keydown.enter="onEnter"
              />
              <kbd class="grid h-5 place-items-center rounded-sm bg-soft px-1.5 text-[11px] font-medium text-dim">Esc</kbd>
            </label>
            <div ref="listbox" role="listbox" class="max-h-[min(26rem,60vh)] overflow-y-auto scroll-py-1 p-1">
              <template v-for="(item, index) in items" :key="item.to + item.group">
                <p v-if="item.group !== items[index - 1]?.group" class="px-2 pb-1 pt-2 text-xs font-medium text-dim">{{ item.group }}</p>
                <button
                  type="button"
                  role="option"
                  tabindex="-1"
                  :aria-selected="index === active"
                  :class="['flex h-9 w-full cursor-default items-center gap-2.5 rounded-md px-2 text-left text-sm', index === active && 'bg-soft']"
                  @mousemove="active = index"
                  @click="run(item)"
                >
                  <app-icon :icon="item.icon" :size="16" :stroke="2" class="shrink-0 text-dim" />
                  <span class="truncate">{{ item.label }}</span>
                  <kbd v-if="item.kbd" class="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-fg/8 px-1 text-xs font-medium text-dim">{{ item.kbd }}</kbd>
                  <icon-corner-down-left v-else-if="index === active" :size="14" class="ml-auto shrink-0 text-dim" />
                </button>
              </template>
              <p v-if="!items.length" class="p-6 text-center text-sm text-dim">{{ $t('select_is_empty') }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { IconCornerDownLeft, IconSearch } from '@tabler/icons-vue'
import { useEventListener } from '@vueuse/core'
import { isCommandPaletteKey, isCommandPaletteOpen, useCommandPalette } from '~/desktop/composables/useCommandPalette'

const query = ref('')
const active = ref(0)
const panel = ref(null)
const listbox = ref(null)
const { items } = useCommandPalette(query)

useLayer(isCommandPaletteOpen, () => (isCommandPaletteOpen.value = false), panel)

// ⌘K / Ctrl K toggles it from anywhere (the browser would focus its own search bar)
useEventListener(window, 'keydown', (event) => {
  if (isCommandPaletteKey(event)) {
    event.preventDefault()
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value
  }
})

watch(isCommandPaletteOpen, () => {
  query.value = ''
  active.value = 0
})
watch(query, () => (active.value = 0))
watch(active, async () => {
  await nextTick()
  listbox.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
})

const move = (step) => (active.value = Math.min(Math.max(active.value + step, 0), items.value.length - 1))

// Enter that commits an IME composition only confirms the typed text
const onEnter = (event) => {
  if (event.isComposing) return
  event.preventDefault()
  run(items.value[active.value])
}

const run = (item) => {
  if (!item) return
  isCommandPaletteOpen.value = false
  navigateTo(item.to)
}
</script>
