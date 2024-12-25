import { get, isArray } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Budget from '~/models/Budget.js'
import Account from '~/models/Account.js'

export default {
  filters: {
    description: {
      displayName: 'Description',
      filterName: 'description_contains',
      bagKey: 'description',
      // displayValue: (item) => item,
      // filterValue: (item) => item,
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
      filterName: 'tag_id',
      bagKey: 'tag',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item),
      filterValue: (item) => get(item, 'id'),
    },
    excludeTag: {
      displayName: '- Tag',
      filterName: '-tag_id',
      bagKey: 'excludedTag',
      displayValue: (item) => Tag.getDisplayNameEllipsized(item),
      filterValue: (item) => get(item, 'id'),
    },
    noTag: {
      displayName: 'No tags',
      filterName: 'has_any_tag',
      bagKey: 'withoutTag',
      filterValue: (item) => (item ? 'false' : null),
    },
    category: {
      displayName: 'Category',
      filterName: 'category_id',
      bagKey: 'category',
      displayValue: (item) => Category.getDisplayName(item),
      filterValue: (item) => get(item, 'id'),
    },
    exceptCategory: {
      displayName: ' -Category',
      filterName: '-category_id',
      bagKey: 'excludedCategory',
      displayValue: (item) => Category.getDisplayName(item),
      filterValue: (item) => get(item, 'id'),
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

    // {
    //   display: `- Account: ${Account.getDisplayName(_filter.excludedAccount)}`,
    //     filter: `-account_is:"${Account.getDisplayName(_filter.excludedAccount)}"`,
    //   active: !!_filter.excludedAccount,
    // },
    // {
    //   display: `Amount > ${_filter.amountStart}`,
    //     filter: `more:"${_filter.amountStart}"`,
    //   active: !!_filter.amountStart,
    // },
    // {
    //   display: `Amount < ${_filter.amountEnd}`,
    //     filter: `less:"${_filter.amountEnd}"`,
    //   active: !!_filter.amountEnd,
    // },
    // {
    //   display: `Date > ${DateUtils.dateToUI(_filter.dateStart)}`,
    //     filter: `date_after:"${DateUtils.dateToString(_filter.dateStart)}"`,
    //   active: !!_filter.dateStart,
    // },
    // {
    //   display: `Date < ${DateUtils.dateToUI(_filter.dateEnd)}`,
    //     filter: `date_before:"${DateUtils.dateToString(_filter.dateEnd)}"`,
    //   active: !!_filter.dateEnd,
    // },
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
