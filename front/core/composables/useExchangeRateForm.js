// Edit one exchange rate: the user's own rate replaces the fetched one until it is reset
export function useExchangeRateForm() {
  const currencyStore = useCurrencyStore()
  const { t } = useI18n()

  const rate = ref(null)
  const value = ref('')

  const isOpen = computed({
    get: () => !!rate.value,
    set: (open) => !open && (rate.value = null),
  })
  const isValid = computed(() => parseFloat(value.value) > 0)

  const open = (item) => {
    rate.value = item
    value.value = String(item.value)
  }

  const apply = async (newValue) => {
    const code = rate.value.code
    rate.value = null
    await currencyStore.setExchangeRate(code, newValue)
    UIUtils.showToastSuccess(t('exchange_rate_page.rate_saved', { code }))
  }

  const save = () => isValid.value && apply(parseFloat(value.value))
  const reset = () => apply(null)

  return { rate, value, isOpen, isValid, open, save, reset }
}
