const separators = new Map()

export const getNumberSeparators = (locale) => {
  if (!separators.has(locale)) {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
    separators.set(locale, {
      decimal: parts.find(({ type }) => type === 'decimal')?.value ?? '.',
      group: parts.find(({ type }) => type === 'group')?.value ?? ',',
    })
  }
  return separators.get(locale)
}

export const normalizeAmount = (value, locale) => {
  const { decimal } = getNumberSeparators(locale)
  let hasDecimal = false
  return [...(value?.toString() ?? '')].reduce((result, character) => {
    if (/\d/.test(character)) return result + character
    if (character === decimal && !hasDecimal) {
      hasDecimal = true
      return result + '.'
    }
    if (/[+\-*/]/.test(character)) {
      hasDecimal = false
      return result + character
    }
    return result
  }, '')
}

export const formatAmountForEdit = (value, locale) => (value?.toString() ?? '').replaceAll('.', getNumberSeparators(locale).decimal)

export const formatAmount = (value, locale) => {
  value = value?.toString() ?? ''
  if (!/^-?\d+(?:\.\d*)?$/.test(value)) return formatAmountForEdit(value, locale)
  const { decimal, group } = getNumberSeparators(locale)
  const [integer, fraction] = value.split('.')
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return fraction === undefined ? formatted : `${formatted}${decimal}${fraction}`
}

export const formatAmountToCurrencyPrecision = (value, decimalPlaces) => {
  const match = value?.toString().match(/^([+-]?)(\d+)(?:\.(\d+))?$/)
  if (!match) {
    return value?.toString() ?? null
  }

  const configuredDecimalPlaces = Number.parseInt(decimalPlaces, 10)
  const fraction = (match[3] ?? '').replace(/0+$/, '')
  const precision = Math.max(Number.isInteger(configuredDecimalPlaces) ? configuredDecimalPlaces : 0, fraction.length)
  const formattedFraction = fraction.padEnd(precision, '0')
  return `${match[1]}${match[2]}${precision ? `.${formattedFraction}` : ''}`
}
