import { Marked } from 'marked'
import { formatAmount } from './AmountUtils.js'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const markdown = new Marked({
  renderer: {
    html: ({ text }) => escapeHtml(text),
    image: ({ text }) => escapeHtml(text),
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens)
      if (!/^(https?:\/\/|mailto:)/i.test(href)) return text
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`
    },
  },
})

export const renderTodoNotes = (notes) => markdown.parse(notes ?? '')

export const hasHiddenTodoReviewData = (splits, extraDateFields = [], profile = {}) =>
  splits.length > 1 ||
  splits.some((split) => {
    const fieldVisible = (code) => profile.transactionListFieldsConfig?.find((field) => field.code === code)?.isVisible !== false
    return (
      (profile.tagsEnabled !== false &&
        ((split.tags?.length ?? 0) > 4 ||
          split.tags?.some((tag) => (typeof tag === 'string' ? tag : (tag?.attributes?.tag ?? '')).length > 10) ||
          (!fieldVisible('tags') && split.tags?.length > 0))) ||
      (profile.categoriesEnabled && ((!split.category && !split.category_name && split.type?.fireflyCode !== 'transfer') || (!fieldVisible('category') && (split.category || split.category_name)))) ||
      (profile.budgetsEnabled && !fieldVisible('budget') && (split.budget || split.budget_name)) ||
      (!fieldVisible('notes') && split.notes) ||
      (profile.recurringTransactionsEnabled !== false && (split.bill_name || split.subscription_name)) ||
      split.amountForeign ||
      split.foreign_amount ||
      extraDateFields.some((field) => split[field.code])
    )
  })

export const hasClippedTodoReviewContent = (element, selector = '.max-2-lines, .ellipse-text, .app-badge') =>
  [...(element?.querySelectorAll(selector) ?? [])].some((node) => node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1)

export const getTodoReviewAmounts = (splits, locale) => {
  const groups = new Map()
  for (const split of splits) {
    const type = split.type?.code ?? split.type
    const currency = split.currency_symbol ?? split.currency_code ?? ''
    const key = `${type}-${split.currency_id ?? split.currency_code ?? currency}`
    const group = groups.get(key) ?? { key, type, currency, values: [] }
    group.values.push(String(split.amount ?? ''))
    groups.set(key, group)
  }
  return [...groups.values()].map(({ key, type, currency, values }) => {
    if (values.some((value) => !/^-?\d+(\.\d+)?$/.test(value))) return { key, type, text: ['—', currency].filter(Boolean).join(' ') }
    const scale = Math.max(...values.map((value) => value.split('.')[1]?.length ?? 0))
    const sum = values.reduce((total, value) => {
      const [integer, fraction = ''] = value.split('.')
      return total + BigInt(integer + fraction.padEnd(scale, '0'))
    }, 0n)
    const digits = (sum < 0n ? -sum : sum).toString().padStart(scale + 1, '0')
    const amount = `${sum < 0n ? '-' : ''}${scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits}`
    const sign = sum < 0n ? '' : type === 'expense' ? '-' : type === 'income' ? '+' : ''
    return { key, type, text: [`${sign}${formatAmount(amount, locale)}`, currency].filter(Boolean).join(' ') }
  })
}
