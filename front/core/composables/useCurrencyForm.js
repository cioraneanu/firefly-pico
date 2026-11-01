import { cloneDeep, get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'
import CurrencyTransformer from '~/core/transformers/CurrencyTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useCurrencyForm(options = {}) {
  const currencyStore = useCurrencyStore()

  const onEvent = (event, payload) => {
    const others = currencyStore.currenciesList.filter((item) => item.id !== form.itemId.value)
    if (event === useFormEvent.postSave) currencyStore.currenciesList = [CurrencyTransformer.transformFromApi(get(payload, 'data.data')), ...others]
    if (event === useFormEvent.postDelete) currencyStore.currenciesList = others
    options.onEvent?.(event, payload)
  }

  const form = useForm({
    routeList: RouteConstants.ROUTE_CURRENCY_LIST,
    routeForm: RouteConstants.ROUTE_CURRENCY_ID,
    model: new Currency(),
    resetFields: () => (fields.name.value = ''),
    fetchItem: () => (form.item.value = cloneDeep(currencyStore.currencyDictionary[useRoute().params.id])),
    ...options,
    onEvent,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'code', parentKey: 'attributes.code' },
    { computed: 'symbol', parentKey: 'attributes.symbol' },
    { computed: 'decimalPlaces', parentKey: 'attributes.decimal_places' },
    { computed: 'isEnabled', parentKey: 'attributes.enabled' },
    { computed: 'isDefault', parentKey: 'attributes.default' },
  ])

  return { ...form, ...fields }
}
