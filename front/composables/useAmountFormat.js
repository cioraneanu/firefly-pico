import { ref, watch } from 'vue'
import { evalMath, removeEndOperators } from '~/utils/MathUtils'
import { parseLocaleNumber, formatLocaleNumber, getLocaleSeparators } from '~/utils/NumberUtils'

export function useAmountFormat({ modelValue, currencyDecimalPlaces, localeCode }) {
  const isFocused = ref(false)
  const displayValue = ref(modelValue.value ?? '')

  const hasMathOperators = (val) => {
    if (!val) return false
    const operators = ['+', '-', '*', '/']
    const afterFirst = val.slice(1)
    return operators.some((op) => afterFirst.includes(op))
  }

  const formatThousandsOnly = (value, localeCodeStr) => {
    if (!value || value === '') return ''
    const { group, decimal } = getLocaleSeparators(localeCodeStr)
    const dotIndex = value.indexOf('.')
    const intPart = dotIndex === -1 ? value : value.substring(0, dotIndex)
    const decPart = dotIndex === -1 ? '' : value.substring(dotIndex + 1)
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group)
    if (dotIndex === -1) return formattedInt
    return formattedInt + decimal + decPart
  }

  const formatForDisplay = (raw) => {
    if (!raw || raw === '') return ''
    const dp = currencyDecimalPlaces.value ?? 2
    const num = parseFloat(raw)
    if (isNaN(num)) return raw
    return formatLocaleNumber(raw, localeCode.value, dp)
  }

  const refreshDisplay = () => {
    if (isFocused.value) {
      displayValue.value = modelValue.value ?? ''
    } else {
      displayValue.value = formatForDisplay(modelValue.value)
    }
  }

  const restoreCursor = (el, rawValue, cursorPos, formattedValue) => {
    if (cursorPos >= rawValue.length) {
      el.setSelectionRange(formattedValue.length, formattedValue.length)
      return
    }
    const digitsBefore = rawValue.slice(0, cursorPos).replace(/\D/g, '').length
    let digitCount = 0
    for (let i = 0; i < formattedValue.length; i++) {
      if (/\d/.test(formattedValue[i])) digitCount++
      if (digitCount === digitsBefore) {
        el.setSelectionRange(i + 1, i + 1)
        return
      }
    }
    el.setSelectionRange(formattedValue.length, formattedValue.length)
  }

  const onFocus = () => {
    isFocused.value = true
    displayValue.value = modelValue.value ?? ''
  }

  const onInput = (e) => {
    const raw = e.target.value
    const cursorPos = e.target.selectionStart

    if (hasMathOperators(raw)) {
      displayValue.value = raw
      modelValue.value = raw
      return
    }

    const parsed = parseLocaleNumber(raw, localeCode.value)
    modelValue.value = parsed

    const formatted = formatThousandsOnly(parsed, localeCode.value)
    displayValue.value = formatted

    requestAnimationFrame(() => {
      restoreCursor(e.target, raw, cursorPos, formatted)
    })
  }

  const onBlur = () => {
    isFocused.value = false
    const raw = displayValue.value
    const parsed = parseLocaleNumber(raw, localeCode.value)
    const clean = removeEndOperators(parsed)
    const { wasSuccessful, value } = evalMath(clean)

    if (wasSuccessful && value !== null) {
      const dp = currencyDecimalPlaces.value ?? 2
      const formatted = Number.isInteger(value)
        ? formatLocaleNumber(value.toString(), localeCode.value, Math.min(dp, 2))
        : formatLocaleNumber(value.toString(), localeCode.value, dp)
      modelValue.value = value.toString()
      displayValue.value = formatted
    } else {
      displayValue.value = raw
    }
  }

  watch(modelValue, () => {
    if (!isFocused.value) {
      displayValue.value = formatForDisplay(modelValue.value)
    }
  })

  displayValue.value = formatForDisplay(modelValue.value)

  return {
    displayValue,
    onInput,
    onFocus,
    onBlur,
    refreshDisplay,
    isFocused,
  }
}
