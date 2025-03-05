import { get, isArray } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Budget from '~/models/Budget.js'
import Account from '~/models/Account.js'
import { useProfileStore } from '~/stores/profileStore.js'
import { translate } from '~/plugins/plugin-i18n.js'


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
      filter: (item) => `id:${item}`,
      display: (item) => `ID: ${ellipsizeText(item, 100)}`,
    },
    description: {
      bagKey: 'description',
      filter: (item) => `description_contains:"${item}"`,
      display: (item) => `Description: ${item}`,
    },
    transactionType: {
      bagKey: 'transactionType',
      filter: (item) => `type:"${item?.fireflyCode}"`,
      display: (item) => `Type: ${translate(item?.t)}`,
      toUrl: (item) => `type=${item?.code}`,
      fromUrl: () => Object.values(Transaction.types).find((type) => type.code === useRoute().query?.type),
    },
    tag: {
      bagKey: 'tag',
      filter: (item) => `tag_is:"${Tag.getDisplayName(item)}"`,
      display: (item) => `Tag: ${Tag.getDisplayNameEllipsized(item)}`,
    },
    excludeTag: {
      bagKey: 'excludedTag',
      filter: (item) => `-tag_is:"${Tag.getDisplayName(item)}"`,
      display: (item) => `- Tag: ${Tag.getDisplayNameEllipsized(item)}`,
    },
    noTag: {
      bagKey: 'withoutTag',
      filter: (item) => `has_any_tag:false`,
      display: (item) => `No tags`,
    },
    category: {
      bagKey: 'category',
      filter: (item) => `category_is:"${Category.getDisplayName(item)}"`,
      display: (item) => `Category: ${Category.getDisplayName(item)}`,
      toUrl: (item) => `category_id=${item.id}`,
      fromUrl: () => useDataStore().categoryDictionary[useRoute().query?.category_id],
    },
    exceptCategory: {
      bagKey: 'excludedCategory',
      filter: (item) => `-category_is:"${Category.getDisplayName(item)}"`,
      display: (item) => `- Category: ${Category.getDisplayName(item)}`,
    },
    noCategory: {
      bagKey: 'withoutCategory',
      filter: (item) => `has_any_category:false`,
      display: (item) => `No category`,
    },
    budget: {
      bagKey: 'budget',
      filter: (item) => `budget_is:"${Budget.getDisplayName(item)}"`,
      display: (item) => `Budget: ${Budget.getDisplayName(item)}`,
    },
    noBudget: {
      bagKey: 'withoutBudget',
      filter: (item) => `has_any_budget:false`,
      display: (item) => `No budget`,
    },
    account: {
      bagKey: 'account',
      filter: (item) => `account_id:"${item.map((account) => account.id)}"`,
      display: (item) => `Account: ${Account.getDisplayName(item)}`,
    },
    exceptAccount: {
      bagKey: 'excludedAccount',
      filter: (item) => `-account_id:"${item.map((account) => account.id).join(',')}"`,
      display: (item) => `- Account: ${item.map((account) => Account.getDisplayName(account)).join(',')}`,
    },
    amountMore: {
      bagKey: 'amountStart',
      filter: (item) => `more:${item}`,
      display: (item) => `Amount > ${item}`,
    },
    amountLess: {
      bagKey: 'amountEnd',
      filter: (item) => `less:${item}`,
      display: (item) => `Amount < ${item}`,
    },
    dateAfter: {
      bagKey: 'dateStart',
      filter: (item) => `date_after:${DateUtils.dateToString(item)}`,
      display: (item) => `Date > ${DateUtils.dateToUI(item)}`,
      toUrl: (item) => `date_start=${DateUtils.dateToString(item)}`,
      fromUrl: () => DateUtils.stringToDate(useRoute().query?.date_start),
    },
    dateBefore: {
      bagKey: 'dateEnd',
      filter: (item) => `date_before:${DateUtils.dateToString(item)}`,
      display: (item) => `Date <  ${DateUtils.dateToUI(item)}`,
      toUrl: (item) => `date_end=${DateUtils.dateToString(item)}`,
      fromUrl: () => DateUtils.stringToDate(useRoute().query?.date_end),
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
