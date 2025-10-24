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
      toUrl: (item) => `id=${item}`,
      fromUrl: () => useRoute().query?.id,
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
      toUrl: (item) => `exclude_category_id=${item.id}`,
      fromUrl: () => useDataStore().categoryDictionary[useRoute().query?.exclude_category_id],
    },
    noCategory: {
      bagKey: 'withoutCategory',
      filter: (item) => `has_any_category:false`,
      display: (item) => `No category`,
      toUrl: (item) => `without_category=true`,
      fromUrl: () => useRoute().query?.without_category,
    },
    tag: {
      bagKey: 'tag',
      filter: (item) => `tag_is:"${Tag.getDisplayName(item)}"`,
      display: (item) => `Tag: ${Tag.getDisplayNameEllipsized(item)}`,
      toUrl: (item) => `tag_id=${item.id}`,
      fromUrl: () => useDataStore().tagDictionaryById[useRoute().query?.tag_id],
    },
    excludeTag: {
      bagKey: 'excludedTag',
      filter: (item) => `-tag_is:"${Tag.getDisplayName(item)}"`,
      display: (item) => `- Tag: ${Tag.getDisplayNameEllipsized(item)}`,
      toUrl: (item) => `exclude_tag_id=${item.id}`,
      fromUrl: () => useDataStore().tagDictionaryById[useRoute().query?.exclude_tag_id],
    },
    noTag: {
      bagKey: 'withoutTag',
      filter: (item) => `has_any_tag:false`,
      display: (item) => `No tags`,
      toUrl: (item) => `without_tag=true`,
      fromUrl: () => useRoute().query?.without_tag,
    },
    budget: {
      bagKey: 'budget',
      filter: (item) => `budget_is:"${Budget.getDisplayName(item)}"`,
      display: (item) => `Budget: ${Budget.getDisplayName(item)}`,
      toUrl: (item) => `budget_id=${item.id}`,
      fromUrl: () => useDataStore().budgetDictionary[useRoute().query?.budget_id],
    },
    noBudget: {
      bagKey: 'withoutBudget',
      filter: (item) => `has_any_budget:false`,
      display: (item) => `No budget`,
      toUrl: (item) => `without_budget=true`,
      fromUrl: () => useRoute().query?.without_budget,
    },
    account: {
      bagKey: 'account',
      filter: (item) => `account_id:"${item.map((account) => account.id)}"`,
      display: (item) => `Account: ${item.map(Account.getDisplayName).join(', ')}`,
      toUrl: (item) => `account_id=${item.map((account) => account.id)}`,
      fromUrl: () => {
        let accountIds = useRoute().query?.account_id
        return accountIds ? accountIds.split(',').map((accountId) => useDataStore().accountDictionary[accountId]) : null
      },
    },
    exceptAccount: {
      bagKey: 'excludedAccount',
      filter: (item) => `-account_id:"${item.map((account) => account.id).join(',')}"`,
      display: (item) => `- Account: ${item.map((account) => Account.getDisplayName(account)).join(',')}`,
      toUrl: (item) => `exclude_account_id=${item.map((account) => account.id)}`,
      fromUrl: () => {
        let accountIds = useRoute().query?.exclude_account_id
        return accountIds ? accountIds.split(',').map((accountId) => useDataStore().accountDictionary[accountId]) : null
      },
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
    amountMore: {
      bagKey: 'amountStart',
      filter: (item) => `more:${item}`,
      display: (item) => `Amount > ${item}`,
      toUrl: (item) => `amount_start=${item}`,
      fromUrl: () => useRoute().query?.amount_start,
    },
    amountLess: {
      bagKey: 'amountEnd',
      filter: (item) => `less:${item}`,
      display: (item) => `Amount < ${item}`,
      toUrl: (item) => `amount_end=${item}`,
      fromUrl: () => useRoute().query?.amount_end,
    },
  },

  getPredefinedFilters() {
    let profileStore = useProfileStore()
    return profileStore.transactionListFilters
  },

  getValuesFromDictionary(value, dictionary) {
    return value ? value.split(',').map((item) => dictionary[item]) : null
  },
}
