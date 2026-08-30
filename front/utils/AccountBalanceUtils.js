const hasAmount = (value) => value !== null && value !== undefined && value !== ''

export const hasVirtualBalance = (virtualBalance) => {
  if (!hasAmount(virtualBalance)) {
    return false
  }

  const amount = Number(virtualBalance)
  return Number.isFinite(amount) && amount !== 0
}

export const getBalanceWithoutVirtual = (currentBalance, virtualBalance) => {
  if (!hasAmount(currentBalance)) {
    return currentBalance
  }

  const currentAmount = Number(currentBalance)
  if (!Number.isFinite(currentAmount)) {
    return currentBalance
  }

  const virtualAmount = hasAmount(virtualBalance) ? Number(virtualBalance) : 0
  if (!Number.isFinite(virtualAmount)) {
    return currentAmount
  }

  return Number((currentAmount - virtualAmount).toFixed(12))
}
