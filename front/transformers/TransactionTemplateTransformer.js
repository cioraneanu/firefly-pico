import { get } from 'lodash-es'
import ApiTransformer from './ApiTransformer'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useBudgetStore } from '~/stores/budgetStore'
import Transaction from '~/models/Transaction'

export default class TransactionTemplateTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const accountStore = useAccountStore()
    const categoryStore = useCategoryStore()
    const tagStore = useTagStore()
    const budgetStore = useBudgetStore()
    const accountsDictionary = accountStore.accountDictionary
    const categoryDictionary = categoryStore.categoryDictionary
    const tagDictionaryById = tagStore.tagDictionaryById

    // item.amount = Transaction.formatAmountForCurrency(get(item, 'amount', 0))
    item.amount = item.amount ?? '0'

    item.account_source = accountsDictionary[item['account_source_id']]
    item.account_destination = accountsDictionary[item['account_destination_id']]
    item.category = categoryDictionary[item['category_id']]
    item.budget = budgetStore.budgetDictionary[item['budget_id']]
    item.tags = (item.tags ?? []).map((transactionTemplateTag) => tagDictionaryById[transactionTemplateTag.tag_id])
    item.extra_names = get(item, 'extra_names', []).map((item) => {
      return {
        value: item.name,
      }
    })

    item.type = Transaction.typesList.find((type) => type.fireflyCode === item.type)
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    // const transactionType = Transaction.getTransactionTypeForAccounts({ source, destination })
    const transactionType = get(item, 'type')

    return {
      id: get(item, 'id'),
      name: get(item, 'name'),
      extra_names: (item.extra_names ?? []).map((item) => item.value?.trim()).filter(Boolean),
      amount: get(item, 'amount'),
      description: get(item, 'description'),
      notes: get(item, 'notes'),
      account_source_id: get(item, 'account_source.id') ?? null,
      account_destination_id: get(item, 'account_destination.id') ?? null,
      category_id: get(item, 'category.id') ?? null,
      budget_id: get(item, 'budget.id'),
      tags: (item.tags ?? []).map((item) => item.id),
      type: get(transactionType, 'fireflyCode'),
      // tags
    }
  }
}
