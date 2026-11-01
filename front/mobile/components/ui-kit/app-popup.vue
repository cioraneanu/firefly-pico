<template>
  <van-popup v-bind="popupProps" :teleport="teleport" :z-index="zIndex">
    <template v-for="slot in Object.keys($slots)" #[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>
  </van-popup>
</template>

<script setup>
const props = defineProps({
  teleport: {
    type: String,
    default: 'body',
  },
  zIndex: {
    type: [String, Number],
    default: undefined,
  },
  popupStyle: {
    type: [String, Object, Array],
    default: null,
  },
})


const mergePopupStyle = (style) => {
  return [style, props.popupStyle].filter(Boolean)
}

const popupProps = computed(() => {
  return {
    round: true,
    position: 'bottom',
    style: mergePopupStyle({ height: '90%', paddingTop: '4px' }),
  }
})
</script>
