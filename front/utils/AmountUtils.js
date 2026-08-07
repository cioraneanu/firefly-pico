const separatorsCache = new Map()

export const getNumberSeparators = (locale) => {
  if (!separatorsCache.has(locale)) {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
    separatorsCache.set(locale, {
      decimal: parts.find(({ type }) => type === 'decimal')?.value ?? '.',
      group: parts.find(({ type }) => type === 'group')?.value ?? ',',
    })
  }
  return separatorsCache.get(locale)
}

export const normalizeAmount = (value, locale) => {
  value = value?.toString() ?? ''
  const { decimal, group } = getNumberSeparators(locale)
  return value.replace(/\d[\d.,]*/g, (number) => {
    const groupIndex = number.indexOf(group)
    const grouped = group !== '.' || (groupIndex > -1 && groupIndex <= 3 && number.slice(groupIndex + 1).replaceAll(group, '').length >= 3)
    return (grouped ? number.replaceAll(group, '') : number).replaceAll(decimal, '.')
  })
}

export const formatAmount = (value, locale) => {
  value = value?.toString() ?? ''
  if (!/^-?\d+(?:\.\d*)?$/.test(value)) return value
  const { decimal, group } = getNumberSeparators(locale)
  const [integer, fraction] = value.split('.')
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return fraction === undefined ? formatted : `${formatted}${decimal}${fraction}`
}

// Position right after the Nth digit, so the caret survives separators being added or removed.
export const caretAfterDigits = (value, digits) => {
  if (digits <= 0) return 0
  let seen = 0
  for (let index = 0; index < value.length; index++) {
    if (/\d/.test(value[index]) && ++seen === digits) return index + 1
  }
  return value.length
}
