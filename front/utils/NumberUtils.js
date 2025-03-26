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
