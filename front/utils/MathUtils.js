import { evaluate } from 'mathjs'

export const NUMBER_FORMAT = {
  eu: { name: '1234.56 -> 1.234,56', code: 'de-DE' },
  international: { name: '1234.56 -> 1,234.56', code: 'en-EN' },
}

export const getFormattedValue = (value, digits = 0) => {
  const profileStore = useProfileStore()
  if (!profileStore.dashboard.showAccountAmounts) {
    return '******'
  }
  if (profileStore.dashboard.showDecimal) {
    digits = 2
  }
  let numberFormatCode = profileStore.numberFormat.code ?? NUMBER_FORMAT.eu.code
  return new Intl.NumberFormat(numberFormatCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
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

    let sanitizedValue = sanitizeMathString(value)
    console.log('sanitize', {value, sanitizedValue})
    let newValue = evaluate(sanitizedValue).toString()
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

export const sanitizeMathString = (value) => {
  // Trim unnecessary spaces and reduce multiple spaces to a single space
  let cleaned = value.trim().replace(/\s+/g, ' ')

  // Replace all spaces with the '+' operator
  cleaned = cleaned.replace(/\s+/g, '+')

  // Handle multiple adjacent operators by keeping only the last one
  cleaned = cleaned.replace(/([+\-*/]){2,}/g, (match) => match[match.length - 1])

  // Remove any trailing operators
  cleaned = cleaned.replace(/[+\-*/]$/, '');
  return cleaned
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
