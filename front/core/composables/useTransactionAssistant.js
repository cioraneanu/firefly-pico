import { debounce, isEqual } from 'lodash-es'
import { addDays, format } from 'date-fns'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import { useFuzzySearchResource } from '~/core/composables/useFuzzySearch'
import { evalMath } from '~/core/utils/MathUtils'
import RomanianLanguageUtils from '~/core/utils/RomanianLanguageUtils'
import { ellipsizeText } from '~/core/utils/Utils'

const emptyParseResult = () => ({ template: null, templateDisplayName: null, tag: null, category: null, amount: null, description: null, isTodo: false, dateOffset: null })

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
        value = value.slice(0, -profileStore.assistantTodoTagMatcher.length)
      }

      value = value.replace(/(^|\s)([+-]\d+)d(?=\s|$)/i, (match, leadingSpace, days) => {
        result.dateOffset = parseInt(days)
        return leadingSpace
      })

      const [, searchWords = '', amountExpression, description = ''] = value.match(/^(\D+)?(?:\s*(\d[.\d\s+\-*/]*))?(?:\s+(.*))?$/) ?? []
      const { wasSuccessful, value: amount } = evalMath(amountExpression)
      result.amount = amountExpression && wasSuccessful ? amount.toString() : null
      result.description = description.trim()

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

  const previewTags = computed(() =>
    [
      { label: t('template'), value: parsed.value.templateDisplayName },
      { label: t('tag'), value: parsed.value.tag && Tag.getDisplayNameEllipsized(parsed.value.tag) },
      { label: t('category'), value: parsed.value.category && Category.getDisplayName(parsed.value.category) },
      { label: t('amount'), value: parsed.value.amount },
      { label: t('description'), value: parsed.value.description && ellipsizeText(parsed.value.description, 20) },
      { label: t('date'), value: parsed.value.dateOffset !== null && format(addDays(new Date(), parsed.value.dateOffset), 'dd MMM') },
    ].filter((previewTag) => !!previewTag.value),
  )

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

  return { parsed, previewTags, flush }
}
