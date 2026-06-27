<template>
  <div class="vant-card flex-column mt-5">
    <div class="vant-card-title flex-center-vertical gap-1">
      {{ $t('transaction.assistant') }}
      <app-tutorial :title="$t('transaction.assistant_tutorial_title')" :body="$t('transaction.assistant_tutorial_body')" />

      <div class="flex-1" />
      <currency-dropdown v-model="profileStore.assistantCurrency" class="text-size-12" :is-clearable="true" />
    </div>
    <div class="text-size-12 text-muted mb-5">{{ $t('transaction.assistant_format') }}</div>

    <div class="display-flex flex-column">
      <div class="flex-center-vertical gap-2">
        <app-field
          ref="assistantFieldRef"
          v-model="assistantText"
          class="van-cell-no-padding compact flex-1"
          label=""
          :placeholder="`${$t('transaction.assistant')} ...`"
          rows="1"
          autosize
          :clearable="true"
        />
      </div>

      <template v-if="previewTags.length > 0 || parsed.isTodo">
        <div class="display-flex flex-center-vertical gap-2 p-5 mt-10 text-size-12 flex-wrap" style="border: 1px dashed black; border-radius: 5px">
          <van-tag v-for="previewTag in previewTags" :key="previewTag.label" round class="assistant-tag" size="medium" type="primary">
            <span>{{ previewTag.label }}</span>
            <span>|</span>
            <span>{{ previewTag.value }}</span>
          </van-tag>

          <template v-if="parsed.isTodo">
            <div class="assistant-tag tag-todo">
              <span>{{ $t('todo') }}</span>
            </div>
          </template>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { debounce } from 'lodash-es/function'
import { isEqual } from 'lodash-es'
import { addDays, format } from 'date-fns'
import Tag from '~/models/Tag'
import AppTutorial from '~/components/ui-kit/app-tutorial.vue'
import Category from '~/models/Category.js'
import { ellipsizeText } from '~/utils/Utils.js'
import { useFuzzySearchResource } from '~/composables/useFuzzySearch.js'

const { t } = useI18n()
const profileStore = useProfileStore()

const emit = defineEmits(['change'])

const assistantText = defineModel({ type: String })

const fuzzySearch = useFuzzySearch()
const assistantFieldRef = ref(null)

const emptyParseResult = () => ({
  template: null,
  templateDisplayName: null, // String showing either template name or the matched extra name
  tag: null,
  category: null,
  amount: null,
  description: null,
  isTodo: false,
  dateOffset: null,
})

const parsed = ref(emptyParseResult())

const parseAssistantText = () => {
  const result = emptyParseResult()
  let text = assistantText.value

  if (text) {
    text = RomanianLanguageUtils.fixBadWordNumbers(text)
    text = text.replace(',', '.')

    if (profileStore.assistantTodoTagMatcher && text.endsWith(profileStore.assistantTodoTagMatcher)) {
      result.isTodo = true
      text = text.slice(0, -profileStore.assistantTodoTagMatcher.length)
    }

    console.log("")
    // "+1d" / "-5d" anywhere in the text moves the transaction date by that many days
    text = text.replace(/(^|\s)([+-]\d+)d(?=\s|$)/i, (match, leadingSpace, days) => {
      result.dateOffset = parseInt(days)
      return leadingSpace
    })

    // 3 groups: <search words> <amount (math expression)> <description>
    const match = text.match(/^(\D+)?(?:\s*(\d[.\d\s+\-*/]*))?(?:\s+(.*))?$/) ?? []
    const [, searchWords = '', amountExpression, description = ''] = match

    const { wasSuccessful, value } = evalMath(amountExpression)
    result.amount = amountExpression && wasSuccessful ? value.toString() : null
    result.description = description.trim()

    const bestGuess = fuzzySearch.search(searchWords)
    if (bestGuess) {
      result.template = bestGuess.type === useFuzzySearchResource.template.type ? bestGuess.item : null
      result.templateDisplayName = result.template ? bestGuess.match : null
      result.tag = bestGuess.type === useFuzzySearchResource.tag.type ? bestGuess.item : null
      result.category = bestGuess.type === useFuzzySearchResource.category.type ? bestGuess.item : null
    }
  }

  if (!isEqual(parsed.value, result)) {
    parsed.value = result
  }
}

watch(assistantText, debounce(parseAssistantText, 200))

onMounted(async () => {
  if (profileStore.autoFocusAssistant) {
    await nextTick()
    assistantFieldRef.value?.focus()
  }
})

const previewTags = computed(() => {
  const result = parsed.value
  return [
    { label: t('template'), value: result.template ? result.templateDisplayName : null },
    { label: t('tag'), value: result.tag ? Tag.getDisplayNameEllipsized(result.tag) : null },
    { label: t('category'), value: result.category ? Category.getDisplayName(result.category) : null },
    { label: t('amount'), value: result.amount },
    { label: t('description'), value: result.description ? ellipsizeText(result.description, 20) : null },
    { label: t('date'), value: result.dateOffset !== null ? format(addDays(new Date(), result.dateOffset), 'dd MMM') : null },
  ].filter((previewTag) => !!previewTag.value)
})

watch(
  [parsed, () => profileStore.assistantCurrency, () => profileStore.profileActiveId],
  ([newParsed, newAssistantCurrency]) => {
    emit('change', {
      transactionTemplate: newParsed.template,
      amount: newParsed.amount,
      tag: newParsed.tag,
      category: newParsed.category,
      description: newParsed.description,
      isTodo: newParsed.isTodo,
      dateOffset: newParsed.dateOffset,
      assistantCurrency: newAssistantCurrency,
    })
  },
)
</script>

