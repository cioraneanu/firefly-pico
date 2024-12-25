import { get, isArray } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Budget from '~/models/Budget.js'
import Account from '~/models/Account.js'

export default {
  filters: {
    id: {
      displayName: 'Id',
      filterName: 'id',
      bagKey: 'id',
      displayValue: (item) => ellipsizeText(item, 100),
    },
    description: {
      displayName: 'Description',
      filterName: 'description_contains',
      bagKey: 'description',
    },
    transactionType: {
      displayName: 'Type',
      filterName: 'type',
      bagKey: 'transactionType',
      displayValue: (item) => get(item, 'name'),
      filterValue: (item) => get(item, 'fireflyCode'),
    },
    tag: {
      displayName: 'Tag',
      filterName: 'tag_is',
      bagKey: 'tag',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item),
      filterValue: (item) => Tag.getDisplayName(item),
    },
    excludeTag: {
      displayName: '- Tag',
      filterName: '-tag_is',
      bagKey: 'excludedTag',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item),
      filterValue: (item) => Tag.getDisplayName(item),
    },
    noTag: {
      displayName: 'No tags',
      filterName: 'has_any_tag',
      bagKey: 'withoutTag',
      filterValue: (item) => (item ? 'false' : null),
    },
    category: {
      displayName: 'Category',
      filterName: 'category_is',
      bagKey: 'category',
      displayValue: (item) => Category.getDisplayName(item),
      filterValue: (item) => Category.getDisplayName(item),
    },
    exceptCategory: {
      displayName: ' -Category',
      filterName: '-category_is',
      bagKey: 'excludedCategory',
      displayValue: (item) => Category.getDisplayName(item),
      filterValue: (item) => Category.getDisplayName(item),
    },
    noCategory: {
      displayName: 'No category',
      filterName: 'has_any_category',
      bagKey: 'withoutCategory',
      filterValue: (item) => (item ? 'false' : null),
    },
    budget: {
      displayName: 'Budget',
      filterName: 'budget_is',
      bagKey: 'budget',
      displayValue: (item) => Budget.getDisplayName(item),
      filterValue: (item) => Budget.getDisplayName(item),
    },
    noBudget: {
      displayName: 'No budget',
      filterName: 'has_any_budget',
      bagKey: 'withoutBudget',
      filterValue: (item) => (item ? 'false' : null),
    },
    account: {
      displayName: 'Account',
      filterName: 'account_id',
      bagKey: 'account',
      displayValue: (item) => Account.getDisplayName(item),
      filterValue: (item) => item?.id,
    },
    exceptAccount: {
      displayName: '- Account',
      filterName: '-account_id',
      bagKey: 'excludedAccount',
      displayValue: (item) => Account.getDisplayName(item),
      filterValue: (item) => item?.id,
    },
    amountMore: {
      displayName: 'Amount >',
      filterName: 'more',
      bagKey: 'amountStart',
    },
    amountLess: {
      displayName: 'Amount <',
      filterName: 'less',
      bagKey: 'amountEnd',
    },
    dateAfter: {
      displayName: 'Date >',
      filterName: 'date_after',
      bagKey: 'dateStart',
      displayValue: (item) => DateUtils.dateToUI(item),
      filterValue: (item) => DateUtils.dateToString(item)
    },
    dateBefore: {
      displayName: 'Date <',
      filterName: 'date_before',
      bagKey: 'dateEnd',
      displayValue: (item) => DateUtils.dateToUI(item),
      filterValue: (item) => DateUtils.dateToString(item)
    },
  },



  getFiltersFromURL() {
    let dataStore = useDataStore()
    const route = useRoute()

    return {
      id: get(route.query, 'id'),
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


  getActiveFilters(filterBag) {
    return Object.values(this.filters)
    .map((item) => {
      let value = get(filterBag, item.bagKey)
      if (!value) {
        return null
      }
      let displayValue = item.displayValue ? (isArray(value) ? value.map((singleValue) => item.displayValue(singleValue)) : item.displayValue(value)) : value
      let filterValue = item.filterValue ? (isArray(value) ? value.map((singleValue) => item.filterValue(singleValue)) : item.filterValue(value)) : value

      return {
        ...item,
        displayValue,
        filterValue,
      }
    })
    .filter((item) => !!item?.filterValue)
    .map((item) => ({
      display: `${item.displayName}: ${item.displayValue}`,
      filter: `${item.filterName}:${item.filterValue}`,
    }))
  },

  getFilterValueFromDictionary(value, dictionary) {
    return value ? value.split(',').map((item) => dictionary[item]) : null
  },
}
