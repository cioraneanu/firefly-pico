<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <slot />

    <template #right>
      <slot name="right" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'

const emit = defineEmits(['onEdit'])
const onEdit = () => {
  emit('onEdit')
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })

onMounted(() => {
  // anime({
  //   targets: '.van-swipe-cell',
  //   translateX: [-50, 0],
  //   opacity: [0, 1],
  //   delay: anime.stagger(50, { start: 0 }), // delay starts at 500ms then increase by 100ms for each elements.
  // })
})
</script>
