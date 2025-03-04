import { get, isArray } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Budget from '~/models/Budget.js'
import Account from '~/models/Account.js'
import { useProfileStore } from '~/stores/profileStore.js'
import { translate } from '~/plugins/plugin-i18n.js'

const route = useRoute()

export default {
  /*
    - bagKey = property inside the filters ref where to get the value from
    - filter = string to add to the backend request which returns filtered data
    - display = string to show in the badges of applied filters
    - toUrl = string to add to the VueRouter url when this filter is applied. If missing will default to `${bagKey}=${filter}`
    - fromUrl = function that reads from the VueRouter url and return a value that will be written at the bagKey.
   */
  filters: {
    id: {
      bagKey: 'id',
      filter: (item) => `id=${item}`,
      display: (item) => `ID: ${ellipsizeText(item, 100)}`,
    },
    description: {
      bagKey: 'description',
      filter: (item) => `description_contains=${item}`,
      display: (item) => `Description: ${item}`,
    },
    transactionType: {
      bagKey: 'transactionType',
      filter: (item) => `type:"${item?.fireflyCode}"`,
      display: (item) => `Type: ${translate(item?.t)}`,
      toUrl: (item) => `type=${item?.code}`,
      fromUrl: () => Object.values(Transaction.types).find((type) => type.code === route.query?.type),
    },
    tag: {
      bagKey: 'tag',
      filter: (item) => `tag_is:"${Tag.getDisplayName(item)}"`,
      display: (item) => `Tag: ${Tag.getDisplayNameEllipsized(item)}`,
    },
    excludeTag: {
      bagKey: 'excludedTag',
      filter: (item) => `-tag_is=${Tag.getDisplayName(item)}`,
      display: (item) => `- Tag: ${Tag.getDisplayNameEllipsized(item)}`,
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
      displayName: 'Date',
      displaySeparator: '>',
      filterName: 'date_after',
      bagKey: 'dateStart',
      displayValue: (item) => DateUtils.dateToUI(item),
      filterValue: (item) => DateUtils.dateToString(item),
    },
    dateBefore: {
      displayName: 'Date',
      displaySeparator: '<',
      filterName: 'date_before',
      bagKey: 'dateEnd',
      displayValue: (item) => DateUtils.dateToUI(item),
      filterValue: (item) => DateUtils.dateToString(item),
    },
  },

  getPredefinedFilters() {
    let profileStore = useProfileStore()

    return {
      account: profileStore.transactionListDefaultFilterAccount,
      dateStart: profileStore.transactionListDefaultFilterDateStart,
      dateEnd: profileStore.transactionListDefaultFilterDateEnd,
    }
  },

  getValuesFromDictionary(value, dictionary) {
    return value ? value.split(',').map((item) => dictionary[item]) : null
  },
}
