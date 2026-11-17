const getSplits = (transaction) => transaction?.attributes?.transactions ?? []
const getJournalId = (split) => String(split.transaction_journal_id)

export function isSameTransactionGroup(original, updated) {
  if (!original?.id || String(original.id) !== String(updated?.id)) return false
  const originalIds = getSplits(original).map(getJournalId)
  const updatedSplits = getSplits(updated)
  const updatedIds = new Set(updatedSplits.map(getJournalId))
  return originalIds.length > 0 && originalIds.length === updatedSplits.length && originalIds.length === updatedIds.size && originalIds.every((id) => updatedIds.has(id))
}

export function getTodoJournalIds(transaction, tagName) {
  return getSplits(transaction)
    .filter((split) => split.transaction_journal_id && split.tags?.includes(tagName))
    .map(getJournalId)
}

export function getTodoTagUpdate(transaction, tagName, journalIds, isTodo) {
  const splits = getSplits(transaction)
  const availableIds = new Set(splits.map(getJournalId))
  if (splits.some((split) => !split.transaction_journal_id) || availableIds.size !== splits.length || journalIds.some((id) => !availableIds.has(id))) return null

  let changed = false
  const transactions = splits.map((split) => {
    // Firefly replaces the split list. Include every journal, even if its tags are untouched.
    const journal = { transaction_journal_id: split.transaction_journal_id }
    if (!journalIds.includes(getJournalId(split))) return journal

    const tags = split.tags ?? []
    const otherTags = tags.filter((tag) => tag !== tagName)
    if ((otherTags.length !== tags.length) === isTodo) return journal

    changed = true
    return { ...journal, tags: isTodo ? [...otherTags, tagName] : otherTags }
  })

  if (!changed) return null
  return {
    apply_rules: false,
    fire_webhooks: false,
    ...(splits.length > 1 ? { group_title: transaction.attributes.group_title } : {}),
    transactions,
  }
}
