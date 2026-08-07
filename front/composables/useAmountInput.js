import { formatAmount, formatAmountForEdit, normalizeAmount } from '~/utils/AmountUtils.js'
import { sanitizeAmount } from '~/utils/MathUtils.js'

export const useAmountInput = (amount) => {
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.numberFormat.code)
  const isFocused = ref(false)
  const displayAmount = ref('')

  const refresh = () => {
    displayAmount.value = (isFocused.value ? formatAmountForEdit : formatAmount)(amount.value, locale.value)
  }

  const onInput = (event) => {
    amount.value = sanitizeAmount(normalizeAmount(event.target.value, locale.value))
    refresh()
    if (event.target.value !== displayAmount.value) event.target.value = displayAmount.value
  }

  const setFocused = (value) => {
    isFocused.value = value
    refresh()
  }

  watch([amount, locale], refresh)
  refresh()

  return {
    input: computed(() => ({ value: displayAmount.value, onInput })),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  }
}
