import { get } from 'lodash-es'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Budget from '~/core/models/Budget'
import Category from '~/core/models/Category'
import RecurringTransaction from '~/core/models/RecurringTransaction'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'
import { useTransactionListItem } from '~/core/composables/useTransactionListItem'

const VISIBLE_CHIPS = 3
const SHORT_NOTES = 48

// One TODO Inbox row: what the reviewer needs to decide without opening the transaction (both apps)
export function useTodoListItem(props) {
  const { t } = useI18n()
  const listItem = useTransactionListItem(props)
  const { profileStore, firstTransaction, isTypeTransfer, categories, tags, budget, hasAttachments } = listItem

  const rawNotes = computed(() => Transaction.getNotes(props.value) ?? '')
  const recurrence = computed(() => useRecurringTransactionStore().recurringTransactionDictionary[get(firstTransaction.value, 'recurrence_id')])
  const externalUrl = computed(() => get(firstTransaction.value, 'external_url'))
  const isCategoryMissing = computed(() => profileStore.categoriesEnabled && !isTypeTransfer.value && categories.value.length === 0)

  const chips = computed(() => [
    ...(profileStore.categoriesEnabled ? categories.value : []).map((category) => ({
      key: `c${category.id}`,
      label: Category.getDisplayName(category),
      icon: Category.getIcon(category) ?? TablerIconConstants.category,
    })),
    ...(profileStore.tagsEnabled ? tags.value : []).map((tag) => ({
      key: `t${tag.id}`,
      label: Tag.getDisplayName(tag),
      icon: Tag.getIcon(tag) ?? TablerIconConstants.tag,
      isTodo: !!get(tag, 'attributes.is_todo'),
    })),
    ...(profileStore.budgetsEnabled && budget.value ? [{ key: 'b', label: Budget.getDisplayName(budget.value), icon: TablerIconConstants.budget }] : []),
  ])

  const details = computed(() =>
    [
      { key: 'date', label: t('date'), value: DateUtils.dateToUIWithTime(Transaction.getDate(props.value)), icon: TablerIconConstants.settingsUserPreferencesDate },
      isCategoryMissing.value && { key: 'category', label: t('category'), value: t('todo_page.not_set'), icon: TablerIconConstants.category, isMissing: true },
      recurrence.value && { key: 'recurrence', label: t('recurring_transaction'), value: RecurringTransaction.getDisplayName(recurrence.value), icon: TablerIconConstants.recurringTransaction },
      hasAttachments.value && { key: 'attachments', label: t('attachments'), value: t('todo_page.has_attachments'), icon: TablerIconConstants.attachment },
      externalUrl.value && { key: 'url', label: t('todo_page.external_link'), value: externalUrl.value, icon: TablerIconConstants.external },
    ].filter(Boolean),
  )

  const canExpand = computed(() => chips.value.length > VISIBLE_CHIPS || rawNotes.value.length > SHORT_NOTES || details.value.length > 1)
  const getVisibleChips = (isExpanded) => (isExpanded ? chips.value : chips.value.slice(0, VISIBLE_CHIPS))

  return { ...listItem, rawNotes, recurrence, chips, details, canExpand, getVisibleChips }
}
