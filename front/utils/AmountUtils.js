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
