<template>
  <div class="van-cell-fake">
    <van-field class="app-field" :label="label" v-bind="dynamicAttrs" @click="onToggle" readonly>
      <template v-for="slot in Object.keys($slots)" v-slot:[slot]="scoped">
        <slot :name="slot" v-bind="scoped ?? {}" />
      </template>

      <template #left-icon>
        <app-icon :icon="TablerIconConstants.toggleRight" :size="20" />
      </template>

      <template #input>
        <div>
          <slot name="icon" :value="modelValue">
            <app-icon :icon="icon" :size="23" :stroke-width="2.0" />
          </slot>
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
