<template>
  <div @click="onChange" class="flex-1 flex-center flex-column cursor-pointer">
    <div>
      <slot name="icon">
        <app-icon :icon="icon" :size="20" />
      </slot>
    </div>
    <div class="text-size-11">{{ label }}</div>

  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import RouteConstants from '~/constants/RouteConstants.js'

const props = defineProps({
  label: {},
  icon: {},
  isActive: {},
  route: {},
})

const onChange = async () => {
  await navigateTo(props.route)
}
</script>
