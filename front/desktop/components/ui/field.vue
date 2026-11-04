<template>
  <div :class="['grid min-w-0 grid-cols-[var(--label-w,9rem)_minmax(0,1fr)] gap-x-4 gap-y-2', top ? 'items-start' : 'items-center']">
    <span :class="['flex items-center gap-2 text-sm font-medium', top && 'pt-1.5']">
      <component :is="icon" v-if="icon" :size="16" class="text-dim" />
      {{ label }}
    </span>
    <div class="flex min-w-0 flex-col gap-1.5">
      <slot />
      <p v-if="error" class="text-[13px] text-danger">{{ error }}</p>
      <p v-else-if="hint" class="text-[13px] leading-[18px] text-dim">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  icon: [Object, Function],
  hint: String,
  top: Boolean,
  rules: { type: Array, default: () => [] },
  value: null,
})

const error = ref('')
const isEmpty = (value) => value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)
const check = (rule) => (rule.required ? !isEmpty(props.value) : !rule.validator || rule.validator(props.value))
const validate = () => !(error.value = props.rules.find((rule) => !check(rule))?.message ?? '')

watch(
  () => props.value,
  () => error.value && validate(),
  { deep: true },
)

const form = inject('d-form', null)
form?.add(validate)
onBeforeUnmount(() => form?.remove(validate))
provide('d-field', { error })
</script>
