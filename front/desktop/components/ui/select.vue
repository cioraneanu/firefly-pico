<template>
  <button
    ref="trigger"
    type="button"
    :disabled
    :class="[
      'flex min-h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border py-1 pl-2.5 pr-2 text-left text-sm outline-none transition-shadow focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-field/30',
      isInvalid ? 'border-danger ring-danger/20' : 'border-field focus-visible:border-ring focus-visible:ring-ring/50',
    ]"
    @click="open = !open"
    @keydown.down.prevent="open ? move(1) : (open = true)"
    @keydown.up.prevent="open && move(-1)"
    @keydown.enter.prevent="open ? pick(filtered[active]) : (open = true)"
  >
    <component :is="icon" v-if="icon && !hasValue" :size="16" class="text-dim" />
    <span v-if="!hasValue" class="flex-1 truncate text-dim">{{ placeholder ?? $t('select_is_empty') }}</span>
    <span v-else-if="multiple" class="flex flex-1 flex-wrap gap-1">
      <d-badge v-for="item in model" :key="keyOf(item)" variant="outline">
        <app-icon v-if="getIcon(item)" :icon="getIcon(item)" :size="12" />
        {{ getLabel(item) }}
        <icon-x :size="12" class="cursor-pointer text-dim hover:text-fg" @click.stop="toggle(item)" />
      </d-badge>
    </span>
    <span v-else class="flex min-w-0 flex-1 items-center gap-2">
      <app-icon v-if="getIcon(model)" :icon="getIcon(model)" :size="16" />
      <span class="truncate">{{ getLabel(model) }}</span>
      <span v-if="getMeta(model)" class="text-xs text-dim">{{ getMeta(model) }}</span>
    </span>
    <icon-x v-if="clearable && hasValue && !multiple" :size="14" class="text-dim hover:text-fg" @click.stop="model = null" />
    <icon-selector :size="16" class="text-dim" />
  </button>

  <d-popover v-model:open="open" :anchor="trigger" match-width>
    <div v-if="isSearchable" class="-mx-1 -mt-1 mb-1 flex h-9 shrink-0 items-center gap-2 border-b border-line px-2.5 text-dim">
      <icon-search :size="16" />
      <input
        v-model="query"
        autofocus
        class="h-full flex-1 text-fg"
        :placeholder="$t('search_placeholder')"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(filtered[active])"
      />
    </div>
    <template v-for="(item, index) in filtered" :key="keyOf(item)">
      <p v-if="getGroup(item) && getGroup(item) !== getGroup(filtered[index - 1])" class="px-1.5 pb-1 pt-2 text-xs font-medium text-dim">{{ getGroup(item) }}</p>
      <button
        type="button"
        role="option"
        :aria-selected="isSelected(item)"
        :class="['relative flex w-full shrink-0 cursor-default items-center gap-2 rounded-md py-1 pl-1.5 pr-8 text-left', index === active && 'bg-soft']"
        :style="{ paddingLeft: `${6 + getIndent(item) * 16}px` }"
        @mouseenter="active = index"
        @click="pick(item)"
      >
        <app-icon v-if="getIcon(item)" :icon="getIcon(item)" :size="16" />
        <span class="truncate">{{ getLabel(item) }}</span>
        <span v-if="getMeta(item)" class="ml-auto pl-3 text-xs text-dim">{{ getMeta(item) }}</span>
        <icon-check v-if="isSelected(item)" :size="16" class="absolute right-2" />
      </button>
    </template>
    <p v-if="!filtered.length" class="py-6 text-center text-dim">{{ $t('select_is_empty') }}</p>
  </d-popover>
</template>

<script setup>
import { IconCheck, IconSearch, IconSelector, IconX } from '@tabler/icons-vue'

const model = defineModel()
const props = defineProps({
  options: { type: Array, default: () => [] },
  getLabel: { type: Function, default: (item) => item?.label ?? item },
  getIcon: { type: Function, default: (item) => item?.icon },
  getMeta: { type: Function, default: () => null },
  getKey: { type: Function, default: null },
  getIndent: { type: Function, default: () => 0 },
  getGroup: { type: Function, default: () => null },
  multiple: Boolean,
  searchable: { type: Boolean, default: null },
  clearable: Boolean,
  disabled: Boolean,
  invalid: Boolean,
  placeholder: String,
  icon: [Object, Function],
})

const trigger = ref(null)
const open = ref(false)
const query = ref('')
const active = ref(0)

const field = inject('d-field', null)
const isInvalid = computed(() => props.invalid || !!field?.error.value)
const keyOf = (item) => props.getKey?.(item) ?? item?.id ?? item?.fireflyCode ?? item?.code ?? item?.value ?? props.getLabel(item)
const hasValue = computed(() => (props.multiple ? model.value?.length > 0 : model.value !== null && model.value !== undefined && model.value !== ''))
const isSearchable = computed(() => props.searchable ?? props.options.length > 7)
const isSelected = (item) => (props.multiple ? (model.value ?? []).some((selected) => keyOf(selected) === keyOf(item)) : hasValue.value && keyOf(model.value) === keyOf(item))
const filtered = computed(() => props.options.filter((item) => LanguageUtils.includesSearch(String(props.getLabel(item) ?? ''), query.value)))

const move = (step) => (active.value = Math.min(Math.max(active.value + step, 0), filtered.value.length - 1))
const toggle = (item) => (model.value = isSelected(item) ? model.value.filter((selected) => keyOf(selected) !== keyOf(item)) : [...(model.value ?? []), item])

const pick = (item) => {
  if (!item) return
  if (props.multiple) return toggle(item)
  model.value = item
  open.value = false
}

watch(open, (value) => value && ((query.value = ''), (active.value = Math.max(filtered.value.findIndex(isSelected), 0))))
</script>
