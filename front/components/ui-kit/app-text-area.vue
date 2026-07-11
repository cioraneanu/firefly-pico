<template>
  <app-field ref="fieldRef" v-model="modelValue" v-bind="fieldAttrs" class="app-text-area">
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

const visibleLineCount = computed(() => Math.max(1, Number(props.visibleLines) || 2))
const fieldAttrs = computed(() => ({
  ...attrs,
  type: 'textarea',
  rows: visibleLineCount.value,
  autosize: true,
}))

const focus = () => {
  fieldRef.value?.focus()
}

defineExpose({ focus })
</script>
