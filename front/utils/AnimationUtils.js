import anime from 'animejs'

export function animateSwipeList(list) {
  watch(list, async (newValue, oldValue) => {
    await nextTick()

    anime({
      targets: `.van-swipe-cell:nth-child(n+${oldValue.length ?? 0})`,
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
      document.querySelector(".van-cell-group")?.removeAttribute('style')
      document.querySelector(".transaction-type-container")?.removeAttribute('style')
      document.querySelector(".vant-card")?.removeAttribute('style')
    },
  })
}

export async function animateSettings() {
  await nextTick()

  anime({
    targets: `.van-cell, .van-grid-item`,
    opacity: [0, 1],
    delay: anime.stagger(45, { start: 0 }),
  })
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

export async function animateBottomToolbarAddButton() {
  anime({
    targets: `#add-new-transaction`,
    scale: [1, 0.2],
    opacity: [1, 0.4],
    direction: 'alternate',
    duration: 150,
    delay: 0,
    easing: 'easeOutSine'
  })
}

export async function animateSaveButton() {
  await nextTick()

  anime({
    targets: '.app-button-save',
    opacity: [0, 1],
    scale: [0.7, 1],
    delay: 200,
    duration: 700,
  })
}


export async function animateOnNext (element) {
  await nextTick()

  anime({
    targets: element,
    duration: 100,
    translateX: [0, 10],
    direction: 'alternate',
    delay: 0,
    easing: 'easeOutSine'
  })
}

export async function animateOnPrevious (element) {
  await nextTick()

  anime({
    targets: element,
    translateX: [0, -10,],
    duration: 100,
    direction: 'alternate',
    delay: 0,
    easing: 'easeOutSine'

  })
}
