<template>
  <div class="mx-f" :class="{ bad: !!error }" @click="emit('click', $event)">
    <slot name="label">
      <div v-if="label" class="mx-l">
        {{ label }}<span v-if="isRequired || required" class="req">*</span>
        <span v-if="hint" class="hint">{{ hint }}</span>
      </div>
    </slot>

    <slot name="input">
      <label class="mx-in" :class="{ ta: isTextarea, dis: disabled }">
        <slot name="left-icon">
          <app-icon v-if="showIcon && icon" :icon="icon" :size="16" :stroke="2" />
        </slot>
        <textarea
          v-if="isTextarea"
          ref="inputRef"
          v-model="modelValue"
          :name="name"
          :rows="rows"
          :placeholder="placeholder ?? label"
          :readonly="readonly"
          :disabled="disabled"
          :maxlength="maxlength"
          :aria-label="label"
          :style="textareaStyle"
          @input="autoGrow"
          @focus="emit('focus', $event)"
          @blur="emit('blur', $event)"
        />
        <input
          v-else
          ref="inputRef"
          v-model="modelValue"
          :name="name"
          :type="inputType"
          :inputmode="inputmode ?? defaultInputMode"
          :placeholder="placeholder ?? label"
          :readonly="readonly"
          :disabled="disabled"
          :maxlength="maxlength"
          :aria-label="label"
          @input="filterNumeric"
          @focus="emit('focus', $event)"
          @blur="emit('blur', $event)"
        />
        <button v-if="isClearVisible" type="button" class="mx-ib sm" style="margin-right: -8px" :aria-label="$t('clear')" @click.prevent="modelValue = ''">
          <app-icon :icon="IconX" :size="14" :stroke="2" />
        </button>
        <slot name="button" />
        <slot name="right-icon" />
        <slot name="right" />
      </label>
    </slot>

    <div v-if="error" class="mx-ferr">{{ error }}</div>
    <div v-else-if="description" class="mx-d">{{ description }}</div>
    <slot name="extra" />
  </div>
</template>

<script setup>
import { IconX } from '@tabler/icons-vue'

// Text input of the mobile kit (design: .mx-f > .mx-l + .mx-in). Label above, hint/description below.
const modelValue = defineModel()

const props = defineProps({
  label: { type: String, default: null },
  name: { type: String, default: null },
  type: { type: String, default: 'text' },
  rules: { type: Array, default: () => [] },
  placeholder: { type: String, default: null },
  description: { type: String, default: null },
  hint: { type: String, default: null },
  rows: { type: [Number, String], default: 1 },
  autosize: { type: [Boolean, Object], default: false },
  readonly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  maxlength: { type: [Number, String], default: null },
  inputmode: { type: String, default: null },
  // Fields carry no icon in the design; kept so existing call sites can still opt in
  icon: { default: null },
  showIcon: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'focus', 'blur'])

const inputRef = ref(null)
const { error, isRequired } = useFormField({ name: () => props.name, rules: () => props.rules, value: modelValue })

const isTextarea = computed(() => props.type === 'textarea')
const inputType = computed(() => ({ digit: 'text', number: 'text' })[props.type] ?? props.type)
const defaultInputMode = computed(() => ({ digit: 'numeric', number: 'decimal' })[props.type] ?? null)
// digit: digits only. number: digits and one decimal point ("," is typed as "." since the value goes to the API)
const numericFilters = {
  digit: (value) => value.replace(/\D/g, ''),
  number: (value) => {
    const [whole, ...decimals] = value
      .replaceAll(',', '.')
      .replace(/[^\d.]/g, '')
      .split('.')
    return decimals.length ? `${whole}.${decimals.join('')}` : whole
  },
}
const filterNumeric = (event) => {
  const value = numericFilters[props.type]?.(event.target.value) ?? event.target.value
  if (value !== event.target.value) {
    event.target.value = modelValue.value = value
  }
}
const isClearVisible = computed(
  () => props.clearable && !props.readonly && !props.disabled && !isTextarea.value && modelValue.value !== null && modelValue.value !== undefined && modelValue.value !== '',
)

const textareaStyle = computed(() => (props.autosize ? { minHeight: 'unset' } : null))
const autoGrow = (event) => {
  if (!props.autosize) {
    return
  }
  const el = event?.target ?? inputRef.value
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
onMounted(() => nextTick(() => isTextarea.value && autoGrow()))
watch(modelValue, () => isTextarea.value && nextTick(() => autoGrow()))

const focus = () => inputRef.value?.focus()
defineExpose({ focus })
</script>
