<template>
  <van-popup v-bind="popupProps" :teleport="teleport" :z-index="zIndex">
    <template v-for="slot in Object.keys($slots)" v-slot:[slot]="scoped">
      <slot :name="slot" v-bind="scoped ?? {}" />
    </template>
  </van-popup>
</template>

<script setup>
const props = defineProps({
  teleport: {
    default: 'body',
  },
  zIndex: {
    type: [String, Number],
  },
})

const appStore = useAppStore()

const popupProps = computed(() => {
  if (appStore.isDesktopLayout) {
    return {
      position: 'center',
      style: { width: '80vw', maxHeight: '70vh', borderRadius: '12px', padding: '16px' },
    }
  }

  return {
    round: true,
    position: 'bottom',
    style: { height: '90%', paddingTop: '4px' },
  }
})
</script>
