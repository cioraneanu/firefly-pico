<template>
  <van-field ref="vanFieldRef" v-model="modelValue" v-bind="dynamicAttrs" class="app-field app-field-text" @focus="onFocus" clearable>
    <template v-for="slot in Object.keys($slots)" v-slot:[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>

    <template v-if="attrs.icon" #left-icon>
      <app-icon :icon="attrs.icon" :size="20" />
    </template>

  </van-field>
</template>

<script setup>
import { useFormAttributes } from '~/composables/useFormAttributes'
import { useScroll } from '@vueuse/core'

const modelValue = defineModel()

const vanFieldRef = ref(null)
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const focus = () => {
  vanFieldRef.value?.focus()
}
defineExpose({ focus })

const onFocus = async () => {
  // const inputRect = vanFieldRef.value.$el.getBoundingClientRect();
  // const inputTop = inputRect.top;
  // const targetScrollPosition = window.scrollY + inputTop;
  //
  // await sleep(500)
  // window.scrollTo({
  //   top: targetScrollPosition,
  //   // behavior: 'smooth' // Optionally, use smooth scrolling
  // });
}
</script>

<style></style>
