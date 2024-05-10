<template>
  <van-checkbox v-model="modelValue">
    <slot name="label">
      {{ props.label }}
    </slot>

    <!--    customize icon-->
    <!--    <template #icon="props">-->
    <!--      <img class="img-icon" :src="props.checked ? activeIcon : inactiveIcon"/>-->
    <!--    </template>-->
  </van-checkbox>
</template>

<script setup>
const modelValue = defineModel()
const props = defineProps({
  label: {},
})
</script>

<style>
.img-icon {
  height: 20px;
}
</style>
