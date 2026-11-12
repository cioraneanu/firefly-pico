<template>
  <span>{{ display }}</span>
</template>

<script setup>
import { formatNumber } from '~/core/utils/NumberUtils'

// Shows a formatted amount ("1.234,56 lei", "−84 RON", "12") and, when it changes, counts its number to the new one in the same format.
// Skipped when animations are off (profileStore.showAnimations), the system asks for reduced motion, or the text around the number changed.
const props = defineProps({ value: { type: [String, Number], default: '' } })

const profileStore = useProfileStore()
const display = ref(String(props.value ?? ''))

const parse = (text) => {
  const match = String(text ?? '').match(/\d[\d.,]*/)
  if (!match) return null
  const decimal = formatNumber(1.5, 1).replace(/\d/g, '')
  const [whole, fraction = ''] = match[0].split(decimal)
  return {
    before: text.slice(0, match.index),
    after: text.slice(match.index + match[0].length),
    number: parseFloat(`${whole.replace(/\D/g, '')}.${fraction || 0}`),
    digits: fraction.length,
  }
}

let frame = null
watch(
  () => String(props.value ?? ''),
  (text, oldText) => {
    cancelAnimationFrame(frame)
    const [from, to] = [parse(oldText), parse(text)]
    const canCount = profileStore.showAnimations && !matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canCount || !from || !to || from.before !== to.before || from.after !== to.after || from.number === to.number) {
      display.value = text
      return
    }

    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / 600, 1)
      const eased = 1 - (1 - progress) ** 3
      display.value = progress < 1 ? `${to.before}${formatNumber(from.number + (to.number - from.number) * eased, to.digits)}${to.after}` : text
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  },
)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
