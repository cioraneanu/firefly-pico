import { get } from 'lodash-es'
import TransactionRepository from '~/core/repository/TransactionRepository'

// Recent transactions the assistant LLM gets as examples: the newest transaction per description,
// as one compact line without amounts. Fetched once and kept for a few minutes, so dictating stays fast.
const CACHE_MS = 10 * 60 * 1000
let cache = { count: 0, at: 0, lines: [] }

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
  if (cache.count === count && Date.now() - cache.at < CACHE_MS) {
    return cache.lines
  }

  // Several transactions often share a description, so read a few pages' worth to find `count` unique ones
  const body = await new TransactionRepository().getAll({ page: 1, pageSize: Math.min(count * 4, 400), showLoading: false })
  const seen = new Set()
  const lines = []
  for (const transaction of get(body, 'data', [])) {
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

  cache = { count, at: Date.now(), lines }
  return lines
}

// New transactions change what the assistant should learn from
export function invalidateAssistantHistory() {
  cache.at = 0
}
