import { get } from 'lodash'
import Transaction from '~/models/Transaction'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Account from '~/models/Account.js'

export function getExcludedTransactionFilters() {
  const appStore = useAppStore()

  let excludedTags = appStore.dashboard.excludedTagsList.map(tag => Tag.getDisplayName(tag))
  let excludedCategories = appStore.dashboard.excludedCategoriesList.map(category => Category.getDisplayName(category))
  let excludedAccounts = appStore.dashboard.excludedAccountsList.map(account => Account.getDisplayName(account))

  return  [
    ...excludedTags.map(tagName => `-tag_is:${tagName}`),
    ...excludedCategories.map(categoryName => `-category_is:${categoryName}`),
    ...excludedAccounts.map(accountName => `-account_is:${accountName}`),
  ]
}


