<template>
  <van-field value="" :label="label" readonly class="app-field-link" v-bind="binding">
    <template #left-icon="state">
      <slot>
        <app-icon v-if="props.icon" :icon="props.icon" :size="props.size" />
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
  isLink: {
    default: true,
  },
})

const binding = computed(() => ({
  'is-link': props.isLink,
}))
</script>

<style></style>
