const parseAmount = (value) => {
  const match = value?.toString().match(/^([+-]?)(\d+)(?:\.(\d+))?$/)
  if (!match) {
    return null
  }

  return {
    isNegative: match[1] === '-',
    integer: match[2],
    fraction: match[3] ?? '',
  }
}

const getCurrencyValue = (split, rawKey, transformedKey) => split?.[rawKey] ?? split?.currency?.[transformedKey] ?? split?.currency?.attributes?.[transformedKey] ?? null

const getCurrencyKey = (split) => {
  const currencyId = getCurrencyValue(split, 'currency_id', 'id')
  const currencyCode = getCurrencyValue(split, 'currency_code', 'code')
  const currencySymbol = getCurrencyValue(split, 'currency_symbol', 'symbol')
  return currencyId ? `id:${currencyId}` : currencyCode ? `code:${currencyCode}` : currencySymbol ? `symbol:${currencySymbol}` : 'unknown'
}

const toMinorUnits = ({ isNegative, integer, fraction }, decimalPlaces) => {
  const digits = `${integer}${fraction.padEnd(decimalPlaces, '0')}`
  const value = BigInt(digits)
  return isNegative ? -value : value
}

const fromMinorUnits = (value, decimalPlaces) => {
  const sign = value < 0n ? '-' : ''
  const digits = (value < 0n ? -value : value).toString().padStart(decimalPlaces + 1, '0')
  if (decimalPlaces === 0) {
    return `${sign}${digits}`
  }

  return `${sign}${digits.slice(0, -decimalPlaces)}.${digits.slice(-decimalPlaces)}`
}

export const getTransactionSplitTotals = (transaction) => {
  const groups = new Map()
  const splits = transaction?.attributes?.transactions ?? []

  splits.forEach((split) => {
    const amount = parseAmount(split?.amount)
    if (!amount) {
      return
    }

    const currencyId = getCurrencyValue(split, 'currency_id', 'id')
    const currencyCode = getCurrencyValue(split, 'currency_code', 'code')
    const currencySymbol = getCurrencyValue(split, 'currency_symbol', 'symbol')
    const declaredDecimalPlaces = Number.parseInt(getCurrencyValue(split, 'currency_decimal_places', 'decimal_places'), 10)
    const decimalPlaces = Math.max(Number.isInteger(declaredDecimalPlaces) ? declaredDecimalPlaces : 0, amount.fraction.length)
    const key = getCurrencyKey(split)

    if (!groups.has(key)) {
      groups.set(key, { amounts: [], currencyId, currencyCode, currencySymbol, decimalPlaces })
    }

    const group = groups.get(key)
    group.amounts.push(amount)
    group.decimalPlaces = Math.max(group.decimalPlaces, decimalPlaces)
  })

  return [...groups.values()].map((group) => {
    const total = group.amounts.reduce((result, amount) => result + toMinorUnits(amount, group.decimalPlaces), 0n)
    return {
      amount: fromMinorUnits(total, group.decimalPlaces),
      currencyId: group.currencyId,
      currencyCode: group.currencyCode,
      currencySymbol: group.currencySymbol,
      decimalPlaces: group.decimalPlaces,
    }
  })
}
