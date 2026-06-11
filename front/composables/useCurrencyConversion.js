import { evalMath, removeEndOperators } from '~/utils/MathUtils'
import { animateShakeAmountInput } from '~/utils/AnimationUtils.js'

export const useCurrencyConversion = ({
  amount,
  amountForeign,
  currencyForeign,
  currencyCode,
  currencyForeignCode,
  currencyDecimalPlaces,
  currencyForeignDecimalPlaces,
  currency
}) => {

  const evaluateModelValue = async (val) => {
    let newAmount = removeEndOperators(val)
    const { wasSuccessful, value } = evalMath(newAmount)
    if (!wasSuccessful) {
      UIUtils.showToastError('Cannot evaluate expression')
      return null
    }

    const hasChanged = parseFloat(newAmount ?? 0) !== parseFloat(value ?? 0)
    hasChanged ? await animateShakeAmountInput() : null

    return value
  }

  const getConversionError = () => {
    if (!currency.value) {
      return 'Source currency is required!'
    }
    if (!currencyForeign.value) {
      return 'Foreign currency is required!'
    }
    return null
  }

  const isConversionValid = () => {
    let error = getConversionError()
    error ? UIUtils.showToastError(error) : null
    return !error
  }

  const convertAmountToForeign = () => {
    if (!isConversionValid()) return
    amountForeign.value = convertCurrency(amount.value, currencyCode.value, currencyForeignCode.value).toFixed(currencyForeignDecimalPlaces.value)
  }

  const convertForeignToAmount = () => {
    if (!isConversionValid()) return
    amount.value = convertCurrency(amountForeign.value, currencyForeignCode.value, currencyCode.value).toFixed(currencyDecimalPlaces.value)
  }

  return {
    evaluateModelValue,
    convertAmountToForeign,
    convertForeignToAmount
  }
}
