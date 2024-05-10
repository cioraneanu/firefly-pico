<template>
  <van-field value="" :label="label" readonly class="app-field-link" is-link>
    <template #left-icon="state">
      <slot>
        <app-icon v-if="props.icon" :icon="props.icon" :size="props.size" />
        <!--        <Icon v-if="props.icon" :name="props.icon" :size="props.size"/>-->
      </slot>
    </template>
  </van-field>
</template>

<script setup>
const props = defineProps({
  label: {},
  icon: {},
  size: {
    default: '20',
  },
})
</script>

<style></style>
