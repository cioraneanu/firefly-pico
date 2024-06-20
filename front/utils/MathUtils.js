import { evaluate } from 'mathjs'

export const NUMBER_FORMAT = {
  eu: { name: '1234.56 -> 1.234,56', code: 'de-DE' },
  international: { name: '1234.56 -> 1,234.56', code: 'en-EN' },
}

export const getFormattedValue = (value, digits = 0) => {
  const appStore = useAppStore()
  if (!appStore.dashboard.showAccountAmounts) {
    return '******'
  }
  if (appStore.dashboard.showDecimal) {
    digits = 2
  }
  let numberFormatCode = appStore.numberFormat.code ?? NUMBER_FORMAT.eu.code
  return new Intl.NumberFormat(numberFormatCode, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

export const isStringANumber = (value) => {
  if (!value || value === '' || value === ' ') {
    return false
  }
  return !isNaN(value)
}

export const isStringAMathExpression = (value) => {
  if (!value || value === '' || value === ' ') {
    return false
  }

  return /^[\d\s()+\-*/.^%]*$/.test(value)
}

export const evalMath = (value) => {
  if (!value || value === '') {
    return {
      wasSuccessful: true,
      hasChanged: true,
      value: '0',
    }
  }

  try {
    let newValue = evaluate(value).toString()
    newValue = parseFloat(newValue).toFixed(2)
    return {
      wasSuccessful: true,
      hasChanged: newValue !== value,
      value: newValue,
    }
  } catch (error) {
    return {
      wasSuccessful: false,
      hasChanged: false,
      value: value,
    }
  }
}

export const removeEndOperators = (inputString) => {
  return inputString.replace(/[+\-*/]+$/, '')
}

export const sanitizeAmount = (inputString) => {
  if (!inputString) {
    return ''
  }
  // Remove bad characters
  inputString = inputString.replace(/[^0-9+\-*/\.,]/g, '')
  inputString = inputString.replace(',', '.')

  // Remove duplicate math operators
  const regexDuplicateOperators = /[-+*/.^]+/g
  return inputString.replace(regexDuplicateOperators, (match) => {
    return match.charAt(match.length - 1)
  })
}
