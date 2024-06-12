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

export async function animateDashboard() {
  await nextTick()

  anime({
    targets: `.van-cell-group`,
    translateX: [-50, 0],
    opacity: [0, 1],
    delay: anime.stagger(200, { start: 0 }),
  })

  // for (let i = 1; i <= 6; i++) {
  //   let selector = `.app-form .van-cell-group:nth-child(${i + 1})`
  //   // let translate = i % 2 === 0 ? [-100, 0] : [100, 0]
  //   let translate = [-100, 0]
  //   let delay = 50 * i
  //   anime({
  //     targets: selector,
  //     translateX: translate,
  //     delay: delay,
  //     duration: 500,
  //     // opacity: [0, 1],
  //     // delay: anime.stagger(200, { start: 0 }),
  //   })
  // }

}
