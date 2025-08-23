import { animate, stagger, createTimeline, utils, createSpring } from 'animejs'
import { useProfileStore } from '~/stores/profileStore.js'

const clearAnimationStyle = (animation) => {
  for (let target of animation.targets) {
    target.removeAttribute('style')
  }
}

export function animateSwipeList(list) {
  if (!useProfileStore().showAnimations) {
    return
  }

  watch(list, async (newValue, oldValue) => {
    await nextTick()

    // initially animate everything, onLoadMore animate only new items
    const animateFromIndex = oldValue?.length === newValue?.length ? 0 : (oldValue.length + 1 ?? 0)
    const targets = `.van-swipe-cell:nth-child(n+${animateFromIndex})`

    animate(targets, {
      translateY: [-50, 0],
      opacity: [0, 1],
      delay: stagger(25, { start: 0 }),
      ease: 'outElastic(1, .5)',
    })
  })
}

export async function animateTransactionForm() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()

  const targets = '.vant-card, .transaction-type-container, .van-cell-group'

  animate(targets, {
    translateY: [-100, 0],
    ease: 'outElastic(1, .5)',
    opacity: [0, 1],
    duration: 1000,
    onComplete: (animation) => {
      clearAnimationStyle(animation) // Leaving "transform: translateY(0px);" after the animation is finished on .van-cell-group causes the app-select popup to not go fullscreen...
    },
  })
}

export async function animateSettings() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()
  const targets = `.van-cell, .van-grid-item`
  animate(targets, {
    opacity: [0, 1],
    ease: 'outElastic(1, .5)',
    delay: stagger(45, { start: 0 }),
  })
}

export async function animateDashboard() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()

  animate('.van-cell-group', {
    opacity: [0, 1],
    ease: 'outElastic(1, .5)',
    duration: 1000,
    delay: stagger(100, { start: 0 }),
  })

  animate('.van-grid-item, .bar-container, .app-select-option-tag', {
    opacity: [0, 1],
    ease: 'outElastic(1, .5)',
    duration: 1000,
    delay: stagger(25, { start: 250 }),
  })
}

export async function animateBottomToolbarAddButton() {
  if (!useProfileStore().showAnimations) {
    return
  }

  animate('#add-new-transaction', {
    scale: [1, 0.2],
    opacity: [1, 0.4],
    alternate: true,
    loop: 1,
    duration: 150,
    delay: 0,
    ease: 'outSine',
  })
}

export async function animateSaveButton() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()

  animate('.app-button-save', {
    opacity: [0, 1],
    scale: [0.7, 1],
    delay: 200,
    ease: 'outElastic(1, .5)',
    duration: 700,
  })
}

export async function animateOnNext() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()
  animate('.dashboard-control-date', {
    translateX: [0, 10],
    duration: 100,
    alternate: true,
    loop: 1,
    delay: 0,
    ease: 'outSine',
    onComplete: (animation) => {
      clearAnimationStyle(animation) // Leaving "transform: translateY(0px);" after the animation is finished on .van-cell-group causes the app-select popup to not go fullscreen...
    },
  })
}

export async function animateOnPrevious() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()

  animate('.dashboard-control-date', {
    translateX: [0, -10],
    duration: 100,
    alternate: true,
    loop: 1,
    delay: 0,
    ease: 'outSine',
    onComplete: (animation) => {
      clearAnimationStyle(animation) // Leaving "transform: translateY(0px);" after the animation is finished on .van-cell-group causes the app-select popup to not go fullscreen...
    },
  })
}

export async function animateShakeAmountInput() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()

  animate('.transaction-amount-field-input', {
    translateY: [0, -13, 0],
    opacity: [1, 0, 1],
    duration: 450,
    ease: 'outCubic',
  })
}

export async function animateTransactionAmountOperatorButtons() {
  if (!useProfileStore().showAnimations) {
    return
  }
  await nextTick()
  utils.set('.transaction-amount-operations', { opacity: 0 })
  utils.set('.transaction-amount-operations .button', { opacity: 0 })

  const timeline = createTimeline()
  timeline
    .add({ duration: 250 })
    .add('.transaction-amount-operations', {
      opacity: [0, 1],
      translateX: [-50, 0],
      scaleX: [0, 1.0],
      duration: 300,
    })
    .add('.transaction-amount-operations .button', {
      opacity: [0, 1],
      translateY: [-5, 0],
      duration: 50,
      delay: stagger(25, { start: 0 }),
    })
}
