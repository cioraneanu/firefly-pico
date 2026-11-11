import { cloneDeep, get, set } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import PiggyBank from '~/core/models/PiggyBank'
import PiggyBankRepository from '~/core/repository/PiggyBankRepository'
import PiggyBankTransformer from '~/core/transformers/PiggyBankTransformer'
import { areIntEqual } from '~/core/utils/DataUtils'
import { generateChildren } from '~/core/utils/VueUtils'

export function usePiggyBankForm(options = {}) {
  const piggyBankStore = usePiggyBankStore()
  const { t } = useI18n()

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

  // Add / remove money: a small form of its own, saved on the stored piggy bank right away (unsaved edits above stay as they are)
  const savedPiggyBank = computed(() => piggyBankStore.piggyBankDictionary[form.itemId.value])
  const money = reactive({ isOpen: false, isAdd: true, amount: '' })
  const moneyAmount = computed(() => Math.abs(parseFloat(money.amount) || 0))
  const moneySavedBefore = computed(() => PiggyBank.getCurrentAmount(savedPiggyBank.value))
  const moneySavedAfter = computed(() => +(moneySavedBefore.value + (money.isAdd ? moneyAmount.value : -moneyAmount.value)).toFixed(2))
  const moneyAccountBalance = computed(() => Account.getBalance(PiggyBank.getAccount(savedPiggyBank.value)))
  const isMoneyTooMuch = computed(() => !money.isAdd && moneySavedAfter.value < 0)
  const canApplyMoney = computed(() => moneyAmount.value > 0 && !isMoneyTooMuch.value)

  const openMoney = (isAdd) => Object.assign(money, { isOpen: true, isAdd, amount: '' })
  const addToMoneyAmount = (value) => (money.amount = String(+(moneyAmount.value + value).toFixed(2)))

  const applyMoney = async () => {
    const piggyBank = cloneDeep(savedPiggyBank.value)
    set(piggyBank, 'attributes.current_amount', String(moneySavedAfter.value))
    const response = await new PiggyBankRepository().update(piggyBank.id, PiggyBankTransformer.transformToApi(piggyBank))
    if (!ResponseUtils.isSuccess(response)) {
      return
    }
    const saved = PiggyBankTransformer.transformFromApi(get(response, 'data.data'))
    piggyBankStore.piggyBankList = piggyBankStore.piggyBankList.map((item) => (areIntEqual(item.id, saved.id) ? saved : item))
    fields.currentAmount.value = get(saved, 'attributes.current_amount')
    money.isOpen = false
    UIUtils.showToastSuccess(t('piggy_bank_page.money_updated'))
  }

  return {
    ...form,
    ...fields,
    stats,
    accountAllowedTypes: [Account.types.asset, Account.types.liability],
    money,
    moneySavedAfter,
    moneyAccountBalance,
    isMoneyTooMuch,
    canApplyMoney,
    openMoney,
    addToMoneyAmount,
    applyMoney,
  }
}
