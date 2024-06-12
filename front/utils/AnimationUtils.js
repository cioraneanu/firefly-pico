import anime from 'animejs'

export function animateSwipeList(list) {
  watch(list, async (newValue, oldValue) => {
    await nextTick()

    anime({
      targets: `.van-swipe-cell:nth-child(n+${oldValue.length ?? 0})`,
      translateX: [-50, 0],
      opacity: [0, 1],
      delay: anime.stagger(25, { start: 0 }), // delay starts at 500ms then increase by 100ms for each elements.
    })
  })
}
