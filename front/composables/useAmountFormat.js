import { ref, watch, nextTick } from 'vue'
import { evalMath, removeEndOperators, sanitizeAmount } from '~/utils/MathUtils'
import { formatLocaleNumber, getLocaleSeparators } from '~/utils/NumberUtils'

export function useAmountFormat({ modelValue, currencyDecimalPlaces, localeCode, inputRef }) {
  const isFocused = ref(false)
  const dirty = ref(false)
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
    dirty.value = false
    displayValue.value = modelValue.value ?? ''
  }

  const onInput = (e) => {
    dirty.value = true
    const raw = e.target.value
    const cursorPos = e.target.selectionStart

    if (hasMathOperators(raw)) {
      const sanitized = sanitizeAmount(raw)
      displayValue.value = sanitized
      modelValue.value = sanitized
      e.target.value = sanitized
      restoreCursor(e.target, raw, cursorPos, sanitized)
      nextTick(() => {
        restoreCursor(e.target, raw, cursorPos, sanitized)
      })
      return
    }

    const { group, decimal } = getLocaleSeparators(localeCode.value)

    let stripped = raw
    if (group === '.') {
      stripped = raw.replace(/\.(?=\d{3})/g, '')
    }

    let clean = ''
    let seenDecimal = false
    for (const c of stripped) {
      if (/\d/.test(c)) {
        clean += c
      } else if ((c === '.' || c === decimal) && !seenDecimal) {
        seenDecimal = true
        clean += '.'
      }
    }

    modelValue.value = clean

    const formatted = formatThousandsOnly(clean, localeCode.value)
    const userTypedGroupSep = group === ','
      ? raw.includes(',')
      : /\.(?=\d{3})/.test(raw)

    if (userTypedGroupSep) {
      displayValue.value = raw
      e.target.value = raw
    } else {
      displayValue.value = formatted
      e.target.value = formatted
      restoreCursor(e.target, raw, cursorPos, formatted)
      nextTick(() => {
        restoreCursor(e.target, raw, cursorPos, formatted)
      })
    }
  }

  const onBlur = () => {
    if (!isFocused.value) return
    isFocused.value = false
    const raw = displayValue.value

    if (!dirty.value) {
      displayValue.value = formatForDisplay(modelValue.value)
      inputRef?.value?.blur()
      return
    }

    const clean = removeEndOperators(modelValue.value)
    const { wasSuccessful, value } = evalMath(clean)

    if (wasSuccessful && value !== null) {
      const dp = currencyDecimalPlaces.value ?? 2
      const rounded = Number.isInteger(value) ? value : parseFloat(value.toFixed(dp))
      const formatted = formatLocaleNumber(rounded.toString(), localeCode.value, dp)
      modelValue.value = rounded.toString()
      displayValue.value = formatted
    } else {
      displayValue.value = raw
    }

    inputRef?.value?.blur()
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
