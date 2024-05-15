<template>
  <div class="van-cell-fake">
    <van-field class="app-field" :label="label" v-bind="dynamicAttrs" @click="onToggle" readonly>
      <template v-if="$slots.label" #label>
        <slot name="label" />
      </template>

      <template #input>
        <div>
          <app-icon :icon="icon" :size="23" :stroke-width="2.0" />
        </div>
      </template>
    </van-field>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const props = defineProps({
  label: {
    type: String,
    default: 'Is it on?',
  },
})

const modelValue = defineModel()

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs, { 'label-align': 'top' })

const onToggle = () => {
  modelValue.value = !modelValue.value
}

const icon = computed(() => (modelValue.value ? TablerIconConstants.booleanCheckOn : TablerIconConstants.booleanCheckOff))
</script>

<style></style>
