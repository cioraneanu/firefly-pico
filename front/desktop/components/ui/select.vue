<template>
  <div
    ref="trigger"
    v-bind="$attrs"
    :class="[
      'flex min-h-8 w-full min-w-0 items-center rounded-lg border transition-shadow focus-within:ring-3 dark:bg-field/30',
      isSearchable ? 'cursor-text' : 'cursor-pointer',
      multiple && model?.length ? 'flex-wrap gap-1 p-1' : 'gap-0',
      disabled && 'pointer-events-none opacity-50',
      isInvalid ? 'border-danger ring-3 ring-danger/20' : 'border-field focus-within:border-ring focus-within:ring-ring/50',
    ]"
    @click="openList"
  >
    <app-icon v-if="leadIcon && !(multiple && model?.length)" :icon="leadIcon" :size="16" :stroke="2" :class="['ml-2.5 shrink-0', hasValue ? 'text-fg' : 'text-dim']" />
    <template v-if="multiple">
      <span v-for="item in model" :key="keyOf(item)" class="inline-flex h-[21px] max-w-full items-center gap-0.5 rounded-sm bg-soft pl-1.5 pr-0.5 text-xs font-medium">
        <app-icon v-if="getIcon(item)" :icon="getIcon(item)" :size="12" :stroke="2" class="mr-0.5 text-dim" />
        <span class="truncate">{{ getLabel(item) }}</span>
        <button type="button" tabindex="-1" class="grid size-4 cursor-pointer place-items-center rounded-[4px] opacity-50 transition hover:bg-fg/8 hover:opacity-100" @click.stop="toggle(item)">
          <icon-x :size="12" />
        </button>
      </span>
    </template>
    <input
      ref="input"
      :value="inputValue"
      :placeholder="inputPlaceholder"
      :readonly="!isSearchable"
      :disabled
      role="combobox"
      :aria-expanded="open"
      autocomplete="off"
      :class="[
        'h-full min-w-0 flex-1 truncate text-sm',
        multiple && model?.length ? 'h-[22px] min-w-16 px-1' : 'px-2.5',
        open && hasValue && !multiple ? 'placeholder:text-fg/55' : '',
        !isSearchable && 'cursor-pointer',
      ]"
      @input="onInput"
      @keydown.down.prevent="open ? move(1) : openList()"
      @keydown.up.prevent="open && move(-1)"
      @keydown.enter.prevent="open ? pick(filtered[active]) : openList()"
      @keydown.delete="multiple && !query && model?.length && toggle(model.at(-1))"
    />
    <span v-if="!open && !multiple && getMeta(model)" class="shrink-0 text-xs text-dim">{{ getMeta(model) }}</span>
    <span class="ml-auto flex shrink-0 items-center pr-[3px]">
      <d-button v-if="clearable && hasValue && !multiple" variant="ghost" size="icon-xs" :icon="IconX" class="text-dim" tabindex="-1" :aria-label="$t('filters.clear')" @click.stop="model = null" />
      <d-button variant="ghost" size="icon-xs" :icon="IconSelector" class="text-dim hover:bg-transparent" tabindex="-1" @click.stop="open ? (open = false) : openList()" />
    </span>
  </div>

  <d-popover v-model:open="open" :anchor="trigger" match-width>
    <template v-for="(item, index) in filtered" :key="keyOf(item)">
      <p v-if="getGroup(item) && getGroup(item) !== getGroup(filtered[index - 1])" class="px-1.5 pb-1 pt-2 text-xs font-medium text-dim">{{ getGroup(item) }}</p>
      <button
        type="button"
        role="option"
        tabindex="-1"
        :aria-selected="isSelected(item)"
        :class="['relative flex w-full shrink-0 cursor-default items-center gap-1.5 rounded-md py-1 pl-1.5 pr-8 text-left', index === active && 'bg-soft']"
        :style="{ paddingLeft: `${6 + getIndent(item) * 16}px` }"
        @mousedown.prevent
        @mouseenter="active = index"
        @click="pick(item)"
      >
        <app-icon v-if="getIcon(item)" :icon="getIcon(item)" :size="16" :stroke="2" class="text-dim" />
        <span class="truncate">{{ getLabel(item) }}</span>
        <span v-if="getMeta(item)" class="ml-auto pl-3 text-xs tabular-nums text-dim">{{ getMeta(item) }}</span>
        <icon-check v-if="isSelected(item)" :size="16" class="absolute right-2" />
      </button>
    </template>
    <p v-if="!filtered.length" class="p-2 text-center text-dim">{{ $t('select_is_empty') }}</p>
  </d-popover>
</template>

<script setup>
import { IconCheck, IconSelector, IconX } from '@tabler/icons-vue'

defineOptions({ inheritAttrs: false })

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

const { t } = useI18n()
const trigger = ref(null)
const input = ref(null)
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

const leadIcon = computed(() => (hasValue.value && !props.multiple && props.getIcon(model.value)) || props.icon)
const valueLabel = computed(() => (hasValue.value && !props.multiple ? String(props.getLabel(model.value) ?? '') : ''))
const inputValue = computed(() => (open.value && isSearchable.value ? query.value : valueLabel.value))
const inputPlaceholder = computed(() => (props.multiple && hasValue.value ? '' : open.value && valueLabel.value ? valueLabel.value : (props.placeholder ?? t('select_is_empty'))))

const move = (step) => (active.value = Math.min(Math.max(active.value + step, 0), filtered.value.length - 1))
const toggle = (item) => (model.value = isSelected(item) ? model.value.filter((selected) => keyOf(selected) !== keyOf(item)) : [...(model.value ?? []), item])

const openList = () => {
  if (props.disabled || open.value) return
  input.value?.focus()
  open.value = true
}

const onInput = (event) => {
  query.value = event.target.value
  active.value = 0
  open.value = true
}

const pick = (item) => {
  if (!item) return
  if (props.multiple) return toggle(item)
  model.value = item
  open.value = false
}

watch(open, (value) => (value ? (active.value = Math.max(filtered.value.findIndex(isSelected), 0)) : (query.value = '')))
</script>
