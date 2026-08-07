import { formatAmount, normalizeAmount } from '~/utils/AmountUtils.js'
import { sanitizeAmount } from '~/utils/MathUtils.js'

export const useAmountInput = ({ amount, locale }) => {
  const displayAmount = ref(formatAmount(amount.value ?? '', locale.value))

  const refreshAmount = (value = amount.value ?? '') => {
    displayAmount.value = formatAmount(value, locale.value)
  }

  const onAmountInput = (event) => {
    const cursor = event.target.selectionStart
    const isAtEnd = cursor === event.target.value.length
    const digitsBeforeCursor = event.target.value.slice(0, cursor).replace(/\D/g, '').length
    amount.value = sanitizeAmount(normalizeAmount(event.target.value, locale.value))
    refreshAmount()
    nextTick(() => {
      const position = isAtEnd
        ? displayAmount.value.length
        : [...displayAmount.value].findIndex((_, index) => displayAmount.value.slice(0, index + 1).replace(/\D/g, '').length === digitsBeforeCursor) + 1
      event.target.setSelectionRange(position, position)
    })
  }

  watch([amount, locale], () => refreshAmount())

  return { displayAmount, onAmountInput }
}
