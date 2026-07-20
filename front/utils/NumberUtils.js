export const NUMBER_FORMAT = {
  eu: { name: '1234.56 -> 1.234,56', code: 'de-DE' },
  international: { name: '1234.56 -> 1,234.56', code: 'en-EN' },
}

export const formatNumber = (value, digits) => {
  const profileStore = useProfileStore()
  let numberFormatCode = profileStore.numberFormat.code ?? NUMBER_FORMAT.eu.code

  return new Intl.NumberFormat(numberFormatCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export const formatNumberForDashboard = (value) => {
  const profileStore = useProfileStore()
  if (!profileStore.dashboard.showAccountAmounts) {
    return '******'
  }
  let digits = profileStore.dashboard.showDecimal ? 2 : 0
  return formatNumber(value, digits)
}

export function getLocaleSeparators(localeCode) {
  const sample = new Intl.NumberFormat(localeCode).formatToParts(1234.56)
  const group = sample.find((p) => p.type === 'group')?.value ?? ','
  const decimal = sample.find((p) => p.type === 'decimal')?.value ?? '.'
  return { group, decimal }
}

export function parseLocaleNumber(value, localeCode) {
  if (!value) return ''
  const { group, decimal } = getLocaleSeparators(localeCode)
  let result = value
  if (group !== '.') {
    result = result.replaceAll(group, '')
  } else if (result.includes(decimal)) {
    result = result.replace(/\.(?=\d{3})/g, '')
  }
  result = result.replace(decimal, '.')
  return result
}

export function formatLocaleNumber(value, localeCode, decimalPlaces = 2) {
  const num = parseFloat(value)
  if (isNaN(num)) return value
  return new Intl.NumberFormat(localeCode, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(num)
}
