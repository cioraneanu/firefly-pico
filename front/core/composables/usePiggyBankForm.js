import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import PiggyBank from '~/core/models/PiggyBank'
import PiggyBankTransformer from '~/core/transformers/PiggyBankTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function usePiggyBankForm(options = {}) {
  const piggyBankStore = usePiggyBankStore()

  const form = useEntityForm({
    list: toRef(piggyBankStore, 'piggyBankList'),
    dictionary: toRef(piggyBankStore, 'piggyBankDictionary'),
    transformer: PiggyBankTransformer,
    routeList: RouteConstants.ROUTE_PIGGY_BANK_LIST,
    routeForm: RouteConstants.ROUTE_PIGGY_BANK_ID,
    model: new PiggyBank(),
    resetFields: () => (fields.name.value = ''),
    ...options,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'account', parentKey: 'attributes.account' },
    { computed: 'targetAmount', parentKey: 'attributes.target_amount' },
    { computed: 'currentAmount', parentKey: 'attributes.current_amount' },
    { computed: 'startDate', parentKey: 'attributes.start_date' },
    { computed: 'targetDate', parentKey: 'attributes.target_date' },
    { computed: 'notes', parentKey: 'attributes.notes' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value)))

  const stats = computed(() => ({
    current: PiggyBank.getCurrentAmount(form.item.value),
    target: PiggyBank.getTargetAmount(form.item.value),
    percent: PiggyBank.getPercent(form.item.value).toFixed(2),
    left: PiggyBank.getLeftToSave(form.item.value),
    symbol: PiggyBank.getCurrencySymbol(form.item.value),
  }))

  return { ...form, ...fields, stats, accountAllowedTypes: [Account.types.asset, Account.types.liability] }
}
