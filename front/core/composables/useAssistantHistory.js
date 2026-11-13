import { get } from 'lodash-es'
import TransactionRepository from '~/core/repository/TransactionRepository'

// Recent transactions the assistant LLM gets as examples: the newest transaction per description,
// as one compact line without amounts. Fetched once per user and count and kept for a few minutes, so dictating stays fast.
const CACHE_MS = 10 * 60 * 1000
// Roughly what one history line costs in the prompt
const TOKENS_PER_LINE = 28
let cache = { key: '', at: 0, lines: [] }

const toLine = (split) => {
  const tags = (get(split, 'tags') ?? []).map((tag) => (typeof tag === 'string' ? tag : get(tag, 'attributes.tag')))
  return [
    `${get(split, 'description')} → ${get(split, 'type.fireflyCode') ?? get(split, 'type')}`,
    `${get(split, 'source_name') ?? '?'} → ${get(split, 'destination_name') ?? '?'}`,
    get(split, 'category_name'),
    tags.length ? `[${tags.join(', ')}]` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export async function getAssistantHistoryLines(count) {
  count = Number(count) || 0
  if (!count) {
    return []
  }
  const key = `${useAppStore().authToken}|${count}`
  if (cache.key === key && Date.now() - cache.at < CACHE_MS) {
    return cache.lines
  }

  // Several transactions often share a description, so read a few pages' worth to find `count` unique ones
  const body = await new TransactionRepository().getAll({ page: 1, pageSize: Math.min(count * 4, 400), showLoading: false })
  const transactions = get(body, 'data')
  if (!Array.isArray(transactions)) {
    return []
  }
  const seen = new Set()
  const lines = []
  for (const transaction of transactions) {
    const split = get(transaction, 'attributes.transactions.0')
    const key = String(get(split, 'description') ?? '')
      .trim()
      .toLowerCase()
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    lines.push(toLine(split))
    if (lines.length >= count) {
      break
    }
  }

  cache = { key, at: Date.now(), lines }
  return lines
}

// The entity context plus, when enabled, the recent transactions
export async function withAssistantHistory(context, count) {
  const recentTransactions = await getAssistantHistoryLines(count)
  return recentTransactions.length ? { ...context, recentTransactions } : context
}

// The history setting on Settings · Assistant (both apps)
export function useAssistantHistoryOptions(historyCount) {
  const { t } = useI18n()
  const historyOptions = computed(() => [{ value: 0, label: t('settings.assistant.history_off') }, ...[25, 50, 100].map((value) => ({ value, label: String(value) }))])
  const historyHelp = computed(() => {
    const count = toValue(historyCount)
    return count ? t('settings.assistant.history_help_on', { count, tokens: count * TOKENS_PER_LINE }) : t('settings.assistant.history_help_off')
  })
  return { historyOptions, historyHelp }
}

// New transactions change what the assistant should learn from
export function invalidateAssistantHistory() {
  cache.at = 0
}
