import anime from 'animejs'

export function animateSwipeList(list) {
  watch(list, async (newValue, oldValue) => {
    await nextTick()

    anime({
      targets: `.van-swipe-cell:nth-child(n+${oldValue.length ?? 0})`,
      // scale: [0.6, 1.0],
      // translateX: [50, 0],
      translateY: [-50, 0],
      opacity: [0, 1],
      delay: anime.stagger(25, { start: 0 }), // delay starts at 500ms then increase by 100ms for each elements.
    })
  })
}

export async function animateTransactionForm() {
  await nextTick()

  const targets = `.vant-card, .transaction-type-container, .van-cell-group`
  anime({
    targets: targets,
    // scale: [1.2, 1.0],
    translateY: [-100, 0],
    opacity: [0, 1],
    duration: 1000,
    complete: function (anim) {
      // Temporary fix... for some reason leaving "transform: translateY(0px);" after the animation is finished on .van-cell-group causes the app-select popup to not go fullscreen... Hmmm...
      document.querySelector(".van-cell-group").removeAttribute('style')
    },
    // easing: 'easeOutElastic(1, .6)'
  })
}

export async function animateSettings() {
  await nextTick()

  anime({
    targets: `.van-cell, .van-grid-item`,

    // translateY: [50, 0],
    opacity: [0, 1],

    // translateY: [-10, 0],
    // opacity: [0.1, 1],
    // duration: 400,
    delay: anime.stagger(45, { start: 0 }),
  })

  // anime({
  //   targets: `.van-cell-group`,
  //   translateY: [-100, 0],
  //   opacity: [0, 1],
  //   duration: 1000,
  //   delay: anime.stagger(100, { start: 200 }),
  // })
}

export async function animateDashboard() {
  await nextTick()

  anime({
    targets: `.van-cell-group`,
    opacity: [0, 1],
    delay: anime.stagger(100, { start: 0 }),
  })


  anime({
    targets: `.van-grid-item, .bar-container, .app-select-option-tag`,
    opacity: [0, 1],
    delay: anime.stagger(25, { start: 250  }),
  })


}
