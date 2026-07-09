<template>
  <app-field ref="fieldRef" v-model="modelValue" v-bind="fieldAttrs" class="app-text-area" :class="{ 'app-text-area-focused': isFocused }" @focus="onFocus" @blur="onBlur">
    <template v-for="slot in Object.keys($slots)" #[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>
  </app-field>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const modelValue = defineModel({ type: String, default: '' })

const props = defineProps({
  visibleLines: {
    type: [Number, String],
    default: 2,
  },
})

const attrs = useAttrs()
const fieldRef = ref(null)
const isFocused = ref(false)

const visibleLineCount = computed(() => Math.max(1, Number(props.visibleLines) || 2))
const collapsedMaxHeight = computed(() => `${visibleLineCount.value * 1.5}em`)
const autosize = computed(() => (isFocused.value ? true : { maxHeight: collapsedMaxHeight.value }))
const fieldAttrs = computed(() => ({
  ...attrs,
  type: 'textarea',
  rows: visibleLineCount.value,
  autosize: autosize.value,
  style: [
    attrs.style,
    {
      '--app-text-area-visible-lines': visibleLineCount.value,
    },
  ],
}))

const focus = () => {
  fieldRef.value?.focus()
}

const onFocus = () => {
  isFocused.value = true
}

const onBlur = () => {
  isFocused.value = false
}

defineExpose({ focus })
</script>
