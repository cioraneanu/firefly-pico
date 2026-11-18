import { debounce, isEqual } from 'lodash-es'
import { addDays, format } from 'date-fns'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import { useFuzzySearchResource } from '~/core/composables/useFuzzySearch'
import { evalMath } from '~/core/utils/MathUtils'
import RomanianLanguageUtils from '~/core/utils/RomanianLanguageUtils'
import { ellipsizeText } from '~/core/utils/Utils'

const DAYS_REGEX = /(?:^|\s)([+-]\d+d)(?=\s|$)/i
const QUICK_ACTIONS = [
  { key: 'isTodo', value: true, label: 'todo' },
  { key: 'days', value: '-1d', label: 'yesterday' },
  { key: 'days', value: '-2d', label: 'two_days_ago' },
]

const emptyParseResult = () => ({ template: null, templateDisplayName: null, tag: null, category: null, amount: null, description: null, isTodo: false, dateOffset: null, parts: {} })

export function useTransactionAssistant(text, onChange) {
  const { t } = useI18n()
  const profileStore = useProfileStore()
  const fuzzySearch = useFuzzySearch()
  const parsed = ref(emptyParseResult())

  const parse = () => {
    const result = emptyParseResult()
    let value = text.value

    if (value) {
      value = RomanianLanguageUtils.fixBadWordNumbers(value).replace(',', '.')

      if (profileStore.assistantTodoTagMatcher && value.endsWith(profileStore.assistantTodoTagMatcher)) {
        result.isTodo = true
        result.parts.todo = profileStore.assistantTodoTagMatcher
        value = value.slice(0, -profileStore.assistantTodoTagMatcher.length)
      }

      value = value.replace(/(^|\s)([+-]\d+)d(?=\s|$)/i, (match, leadingSpace, days) => {
        result.dateOffset = parseInt(days)
        result.parts.date = `${days}d`
        return leadingSpace
      })

      const [, searchWords = '', amountExpression, description = ''] = value.match(/^(\D+)?(?:\s*(\d[.\d\s+\-*/]*))?(?:\s+(.*))?$/) ?? []
      const { wasSuccessful, value: amount } = evalMath(amountExpression)
      result.amount = amountExpression && wasSuccessful ? amount.toString() : null
      result.description = description.trim()
      Object.assign(result.parts, { search: searchWords.trim(), amount: amountExpression?.trim(), description: result.description })

      const bestGuess = fuzzySearch.search(searchWords)
      if (bestGuess) {
        result.template = bestGuess.type === useFuzzySearchResource.template.type ? bestGuess.item : null
        result.templateDisplayName = result.template ? bestGuess.match : null
        result.tag = bestGuess.type === useFuzzySearchResource.tag.type ? bestGuess.item : null
        result.category = bestGuess.type === useFuzzySearchResource.category.type ? bestGuess.item : null
      }
    }

    if (!isEqual(parsed.value, result)) parsed.value = result
  }

  const debouncedParse = debounce(parse, 200)
  watch(text, debouncedParse)

  // key: what the part became; removing a template/tag/category drops the search words
  const previewTags = computed(() =>
    [
      { key: 'template', label: t('template'), value: parsed.value.templateDisplayName },
      { key: 'tag', label: t('tag'), value: parsed.value.tag && Tag.getDisplayNameEllipsized(parsed.value.tag) },
      { key: 'category', label: t('category'), value: parsed.value.category && Category.getDisplayName(parsed.value.category) },
      { key: 'amount', label: t('amount'), value: parsed.value.amount },
      { key: 'description', label: t('description'), value: parsed.value.description && ellipsizeText(parsed.value.description, 20) },
      { key: 'date', label: t('date'), value: parsed.value.dateOffset !== null && format(addDays(new Date(), parsed.value.dateOffset), 'dd MMM') },
      { key: 'todo', label: t('tag'), value: parsed.value.isTodo && t('todo') },
    ].filter((previewTag) => !!previewTag.value),
  )

  // Drops one recognized part from the text (the × on a preview tag)
  const removePreviewTag = (key) => {
    const part = ['template', 'tag', 'category'].includes(key) ? 'search' : key
    const { search, amount, description, date, todo } = { ...parsed.value.parts, [part]: null }
    text.value = [search, amount, description, date, todo].filter(Boolean).join(' ')
  }

  // Quick actions toggle the todo matcher / a day offset in the text, right away (no debounce)
  const quickState = computed(() => {
    const matcher = profileStore.assistantTodoTagMatcher
    let rest = (text.value ?? '').trim()
    const isTodo = !!matcher && rest.endsWith(matcher)
    if (isTodo) rest = rest.slice(0, -matcher.length)
    return { rest: rest.replace(DAYS_REGEX, '').trim(), days: rest.match(DAYS_REGEX)?.[1].toLowerCase(), isTodo }
  })

  const quickActions = computed(() => QUICK_ACTIONS.map((action) => ({ ...action, isOn: quickState.value[action.key] === action.value })))

  const toggleQuickAction = ({ key, value }) => {
    const { rest, days, isTodo } = { ...quickState.value, [key]: quickState.value[key] === value ? null : value }
    text.value = `${[rest, days].filter(Boolean).join(' ')} ${isTodo ? profileStore.assistantTodoTagMatcher : ''}`.trimStart()
  }

  watch([parsed, () => profileStore.assistantCurrency, () => profileStore.profileActiveId], ([result, assistantCurrency]) =>
    onChange({
      transactionTemplate: result.template,
      amount: result.amount,
      tag: result.tag,
      category: result.category,
      description: result.description,
      isTodo: result.isTodo,
      dateOffset: result.dateOffset,
      assistantCurrency,
    }),
  )

  // Parses what was typed right away (Enter saves without waiting for the debounce)
  const flush = () => debouncedParse.flush()

  return { parsed, previewTags, removePreviewTag, quickActions, toggleQuickAction, flush }
}
