import { animate, stagger, createTimeline, utils, cubicBezier } from 'animejs'
import { useProfileStore } from '~/core/stores/profileStore.js'

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

    // Rows and their day / group headers: all of them on a refresh, only the ones a new page added on load more
    const elements = [...document.querySelectorAll('.mx-body .mx-swipe, .mx-body .mx-grp')]
    const targets = oldValue?.length === newValue?.length ? elements : elements.filter((element) => !element.dataset.shown)
    elements.forEach((element) => (element.dataset.shown = '1'))
    if (targets.length === 0) {
      return
    }

    animate(targets, {
      translateY: [14, 0],
      opacity: [0, 1],
      duration: 380,
      // Rows past the first screen do not wait for their turn
      delay: (_, index) => Math.min(index, 14) * 22,
      ease: 'outCubic',
    })
  })
}

// <transition :css="false" @leave="animateCollapse">: a card leaving a .mx-body folds away, so the content below glides up instead of jumping
export function animateCollapse(element, done) {
  if (!useProfileStore().showAnimations) {
    return done()
  }

  element.style.overflow = 'hidden'
  animate(element, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: -12, // the .mx-body gap
    opacity: { to: 0, duration: 140 },
    duration: 300,
    ease: cubicBezier(0.32, 0.72, 0, 1),
    onComplete: done,
  })
}

export async function animateSettings() {
  if (!useProfileStore().showAnimations) {
    return
  }

  await nextTick()
  const targets = `.mx-body .mx-row, .mx-body .mx-tg`
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

  animate('.mx-body > .mx-card', {
    opacity: [0, 1],
    ease: 'outElastic(1, .5)',
    duration: 1000,
    delay: stagger(100, { start: 0 }),
  })

  animate('.mx-tile, .mx-bar', {
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
      clearAnimationStyle(animation) // Leaving "transform: translateY(0px);" after the animation is finished on a card breaks the absolutely positioned sheets inside it
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
      clearAnimationStyle(animation) // Leaving "transform: translateY(0px);" after the animation is finished on a card breaks the absolutely positioned sheets inside it
    },
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
