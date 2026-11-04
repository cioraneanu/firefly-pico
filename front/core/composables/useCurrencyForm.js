import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'
import CurrencyTransformer from '~/core/transformers/CurrencyTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useCurrencyForm(options = {}) {
  const currencyStore = useCurrencyStore()

  const form = useEntityForm({
    list: toRef(currencyStore, 'currenciesList'),
    dictionary: toRef(currencyStore, 'currencyDictionary'),
    transformer: CurrencyTransformer,
    routeList: RouteConstants.ROUTE_CURRENCY_LIST,
    routeForm: RouteConstants.ROUTE_CURRENCY_ID,
    model: new Currency(),
    resetFields: () => (fields.name.value = ''),
    ...options,
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
