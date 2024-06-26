import { get } from 'lodash'
import Transaction from '~/models/Transaction'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Account from '~/models/Account.js'

export function getExcludedTransactionFilters() {
  const profileStore = useProfileStore()

  let excludedTags = profileStore.dashboard.excludedTagsList.map((tag) => Tag.getDisplayName(tag))
  let excludedCategories = profileStore.dashboard.excludedCategoriesList.map((category) => Category.getDisplayName(category))
  let excludedAccounts = profileStore.dashboard.excludedAccountsList.map((account) => Account.getDisplayName(account))

  return [
    ...excludedTags.map((tagName) => `-tag_is:"${tagName}"`),
    ...excludedCategories.map((categoryName) => `-category_is:"${categoryName}"`),
    ...excludedAccounts.map((accountName) => `-account_is:"${accountName}"`),
  ]
}

export function getExcludedTransactionUrl() {
  const profileStore = useProfileStore()

  let excludedTags = profileStore.dashboard.excludedTagsList.map((tag) => tag.id)
  let excludedCategories = profileStore.dashboard.excludedCategoriesList.map((category) => category.id)
  let excludedAccounts = profileStore.dashboard.excludedAccountsList.map((account) => account.id)

  let list = [
    ...excludedTags.map((tagId) => `excluded_tag_id=${tagId}`),
    ...excludedCategories.map((categoryId) => `excluded_category_id=${categoryId}`),
    ...excludedAccounts.map((accountId) => `excluded_account_id=${accountId}`),
  ]
  return (list.length === 0) ? "" : `&${list.join("&")}`
}
