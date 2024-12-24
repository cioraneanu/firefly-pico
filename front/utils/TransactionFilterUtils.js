import { get } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'

export default {

  filters: {
    description: {
      displayName: 'Description',
      filterName: 'description_contains',
      displayValue: (item) => item.description,
      filterValue: (item) => item.description
    },
    transactionType: {
      displayName: 'Type',
      filterName: 'type',
      displayValue: (item) => get(item, 'transactionType.name'),
      filterValue: (item) => get(item, 'transactionType.fireflyCode')
    },
    tag: {
      displayName: 'Tag',
      filterName: 'tag_id',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item.tag),
      filterValue: (item) => get(item, 'tag.id')
    },
    excludeTag: {
      displayName: '- Tag',
      filterName: '-tag_id',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item.excludedTag),
      filterValue: (item) => get(item, 'excludedTag.id')
    },
    noTag: {
      displayName: 'No tags',
      filterName: 'has_any_tag',
      filterValue: (item) => item.withoutTag ? false : null
    },


  },


  getFiltersFromURL() {
    let dataStore = useDataStore()
    const route = useRoute()

    return {
      tag: dataStore.tagDictionaryById[get(route.query, 'tag_id')],
      excludedTag: dataStore.tagDictionaryById[get(route.query, 'excluded_tag_id')],
      transactionType: Object.values(Transaction.types).find((item) => item.code === get(route.query, 'type')),
      category: dataStore.categoryDictionary[get(route.query, 'category_id')],
      budget: dataStore.budgetDictionary[get(route.query, 'budget_id')],
      excludedCategory: dataStore.categoryDictionary[get(route.query, 'excluded_category_id')],
      // account: dataStore.accountDictionary[get(route.query, 'account_id')],
      account: this.getFilterValueFromDictionary(get(route.query, 'account_id'), dataStore.accountDictionary),
      excludedAccount: dataStore.accountDictionary[get(route.query, 'excluded_account_id')],
      description: get(route.query, 'description'),
      dateStart: DateUtils.stringToDate(get(route.query, 'date_start')),
      dateEnd: DateUtils.stringToDate(get(route.query, 'date_end')),
      amountStart: get(route.query, 'amount_start'),
      amountEnd: get(route.query, 'amount_end'),
      withoutTag: get(route.query, 'without_tag'),
      withoutBudget: get(route.query, 'without_budget'),
      withoutCategory: get(route.query, 'without_category'),
    }
  },

  getFilterValueFromDictionary(value, dictionary) {
    return value ? value.split(',').map((item) => dictionary[item]) : null
  },
}
