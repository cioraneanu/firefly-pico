import { sanitizeAmount } from '~/core/utils/MathUtils'

// Edit one exchange rate: the user's own rate replaces the fetched one until it is reset
export function useExchangeRateForm() {
  const currencyStore = useCurrencyStore()
  const { t } = useI18n()

  const rate = ref(null)
  const value = ref('')
  // Kept apart from rate so the dialog keeps its title while it closes
  const isOpen = ref(false)

  const number = computed(() => parseFloat(sanitizeAmount(String(value.value))))
  const isValid = computed(() => number.value > 0)

  const open = (item) => {
    rate.value = item
    value.value = String(item.value)
    isOpen.value = true
  }

  const apply = async (newValue) => {
    const code = rate.value.code
    isOpen.value = false
    await currencyStore.setExchangeRate(code, newValue)
    UIUtils.showToastSuccess(t('exchange_rate_page.rate_saved', { code }))
  }

  // The fetched rate typed back in is no override
  const save = () => isValid.value && apply(number.value === rate.value.fetchedValue ? null : number.value)
  const reset = () => apply(null)

  return { rate, value, isOpen, isValid, open, save, reset }
}
