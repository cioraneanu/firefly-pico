export const getNumberSeparators = (locale) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
  return {
    decimal: parts.find(({ type }) => type === 'decimal')?.value ?? '.',
    group: parts.find(({ type }) => type === 'group')?.value ?? ',',
  }
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
