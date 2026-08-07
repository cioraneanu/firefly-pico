import { caretAfterDigits, formatAmount, getNumberSeparators, normalizeAmount } from '~/utils/AmountUtils.js'
import { sanitizeAmount } from '~/utils/MathUtils.js'

// Keeps a text input showing a locale formatted amount while the model stays a plain
// "1234.5" string. Returns bindings to spread onto the input with v-bind.
export const useAmountInput = (amount) => {
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.numberFormat.code)
  const displayAmount = ref(formatAmount(amount.value, locale.value))

  const onInput = (event) => {
    const input = event.target
    let value = input.value
    let cursor = input.selectionStart

    // Deleting a group separator is otherwise a no-op, since re-formatting puts it straight
    // back. Drop the digit next to it instead, the way a native number field behaves.
    const { decimal, group } = getNumberSeparators(locale.value)
    if (value.length === displayAmount.value.length - 1 && displayAmount.value[cursor] === group) {
      const digit = event.inputType === 'deleteContentForward' ? cursor : cursor - 1
      if (digit >= 0 && digit < value.length) {
        value = value.slice(0, digit) + value.slice(digit + 1)
        cursor = digit
      }
    }

    // We insert group separators ourselves, so a typed "." is only ever meant as a decimal
    // point -- even in locales that group with "." and would otherwise strip it. Pasted text
    // has no keystroke to read, so normalizeAmount still has to guess there.
    if (event.inputType === 'insertText' && event.data === '.' && decimal !== '.') {
      const withoutTyped = value.slice(0, cursor - 1) + value.slice(cursor)
      if (!withoutTyped.includes(decimal)) {
        value = value.slice(0, cursor - 1) + decimal + value.slice(cursor)
      }
    }

    const isAtEnd = cursor === value.length
    const digitsBeforeCursor = value.slice(0, cursor).replace(/\D/g, '').length

    amount.value = sanitizeAmount(normalizeAmount(value, locale.value))
    displayAmount.value = formatAmount(amount.value, locale.value)

    // A rejected keystroke leaves displayAmount untouched, so Vue never re-renders and the
    // stray character would stay in the DOM. Write the value back ourselves instead.
    input.value = displayAmount.value
    const position = isAtEnd ? displayAmount.value.length : caretAfterDigits(displayAmount.value, digitsBeforeCursor)
    input.setSelectionRange(position, position)
  }

  watch([amount, locale], () => {
    displayAmount.value = formatAmount(amount.value, locale.value)
  })

  return computed(() => ({ value: displayAmount.value, onInput }))
}
