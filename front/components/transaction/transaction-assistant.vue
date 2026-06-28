<template>
  <div class="vant-card flex-column mt-5">
    <div class="vant-card-title flex-center-vertical gap-1">
      {{ $t('transaction.assistant') }}
      <app-tutorial :title="$t('transaction.assistant_tutorial_title')" :body="$t('transaction.assistant_tutorial_body')" />

      <div class="flex-1" />
      <currency-dropdown v-model="profileStore.assistantCurrency" class="text-size-12" :is-clearable="true" />
      <van-button size="small" class="cursor-pointer" @click="openRamblePopup">
        <icon-wand :size="18"/>
      </van-button>
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
        <div class="display-flex flex-center-vertical gap-2 p-5 mt-10 text-size-12 flex-wrap border border-radius">
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

    <app-popup v-model:show="showRamblePopup">
      <div class="display-flex flex-direction-column h-100 m-h-0">
        <div class="display-flex align-items-start gap-2 px-3 py-2 border-bottom">
          <div class="flex-1-w">
            <div class="font-600 text-size-16">{{ $t('transaction.assistant_ramble_title') }}</div>
            <div v-if="rambleTransactions.length > 0" class="text-size-12 text-muted mt-5">{{ $t('transaction.assistant_ramble_preview') }}</div>
          </div>

          <van-button size="small" class="cursor-pointer" @click="closeRamblePopup">
            <app-icon :icon="TablerIconConstants.close" :size="18" />
          </van-button>
        </div>

        <div class="flex-1 m-h-0 overflow-auto display-flex flex-direction-column gap-2 p-3">
          <van-cell-group inset class="no-margin overflow-hidden">
            <app-field
              v-model="rambleText"
              class="van-cell-no-padding compact"
              label=""
              type="textarea"
              rows="5"
              autosize
              :placeholder="$t('transaction.assistant_ramble_placeholder')"
              :clearable="true"
            />

            <div v-if="speechTemporary" class="display-flex flex-center-vertical gap-1 text-size-12 text-muted px-3 pb-2">
              <app-icon :icon="TablerIconConstants.microphone" :size="14" />
              <span>{{ speechTemporary }}</span>
            </div>

            <div class="display-flex flex-wrap gap-2 px-3 py-2">
              <van-button :type="isRecording ? 'danger' : 'primary'" size="small" class="cursor-pointer" @click="toggleRecording">
                <app-icon :icon="isRecording ? TablerIconConstants.stop : TablerIconConstants.microphone" :size="16" />
                {{ isRecording ? $t('stop') : $t('transaction.assistant_dictate') }}
              </van-button>

              <van-button type="primary" plain size="small" class="cursor-pointer" :loading="isInterpreting" :disabled="!rambleText.trim()" @click="interpretRambleText">
                <app-icon :icon="TablerIconConstants.magic" :size="16" />
                {{ $t('transaction.assistant_ramble_interpret') }}
              </van-button>
            </div>
          </van-cell-group>

          <div v-if="rambleError" class="text-size-12 text-danger px-3">{{ rambleError }}</div>

          <template v-if="rambleTransactions.length > 0">
            <div class="display-flex flex-direction-column gap-2">
              <van-cell-group v-for="(transaction, index) in rambleTransactions" :key="transaction.id" inset class="no-margin">
                <div class="p-10">
                  <div class="display-flex align-items-start gap-2">
                    <div class="tag-gray text-size-12">{{ index + 1 }}</div>
                    <div class="flex-1-w">
                      <div class="font-600 text-size-14 word-break-word">{{ transaction.description || '-' }}</div>
                      <div v-if="getRambleAccountSummary(transaction)" class="text-size-12 text-muted word-break-word">{{ getRambleAccountSummary(transaction) }}</div>
                    </div>
                    <div class="font-600 text-size-14 text-nowrap">{{ formatRambleAmount(transaction) }}</div>
                  </div>

                  <div class="display-flex flex-wrap gap-1 mt-10">
                    <van-tag v-for="previewTag in getRamblePreviewTags(transaction)" :key="`${transaction.id}-${previewTag.label}`" round size="medium" type="primary">
                      <span>{{ previewTag.label }}</span>
                      <span>|</span>
                      <span>{{ previewTag.value }}</span>
                    </van-tag>
                  </div>
                </div>
              </van-cell-group>
            </div>
          </template>

          <div v-else-if="hasInterpreted" class="text-size-12 text-muted text-center p-20">{{ $t('transaction.assistant_ramble_no_results') }}</div>
        </div>

        <div class="display-flex gap-2 p-3 border-top">
          <van-button block class="cursor-pointer" :disabled="rambleTransactions.length === 0" @click="applyFirstRambleTransaction">{{ $t('transaction.assistant_ramble_apply_first') }}</van-button>
          <van-button block type="primary" class="cursor-pointer" :disabled="rambleTransactions.length === 0" @click="createRambleTransactions">
            {{ $t('transaction.assistant_ramble_create', { count: rambleTransactions.length }) }}
          </van-button>
        </div>
      </div>
    </app-popup>
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
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { IconWand, IconAi } from '@tabler/icons-vue'
import AssistantRepository from '~/repository/AssistantRepository.js'
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Currency from '~/models/Currency.js'
import TransactionTemplate from '~/models/TransactionTemplate.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import * as LanguageConstants from '~/constants/LanguageConstants.js'
import { useSpeechRecognition } from '~/composables/useSpeechRecognition.js'

const { t } = useI18n()
const profileStore = useProfileStore()
const tagStore = useTagStore()
const categoryStore = useCategoryStore()
const templateStore = useTemplateStore()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const currencyStore = useCurrencyStore()

const emit = defineEmits(['change', 'create-many'])

const assistantText = defineModel({ type: String })

const fuzzySearch = useFuzzySearch()
const assistantFieldRef = ref(null)
const showRamblePopup = ref(false)
const rambleText = ref('')
const rambleTransactions = ref([])
const speechTemporary = ref('')
const isInterpreting = ref(false)
const hasInterpreted = ref(false)
const rambleError = ref('')

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

const speechLanguage = computed(() => {
  const languageMap = {
    en: LanguageConstants.LANGUAGE_ENGLISH,
    ro: LanguageConstants.LANGUAGE_ROMANIAN,
    pl: LanguageConstants.LANGUAGE_POLISH,
    'ru-RU': LanguageConstants.LANGUAGE_RUSSIAN,
    'fr-FR': LanguageConstants.LANGUAGE_FRENCH,
  }

  return { code: languageMap[profileStore.language] ?? profileStore.language ?? LanguageConstants.LANGUAGE_ENGLISH }
})

const appendDictatedText = (text) => {
  text = (text ?? '').trim()
  if (!text) {
    return
  }

  rambleText.value = [rambleText.value.trim(), text].filter(Boolean).join(' ')
}

const { startRecording, stopRecording, isRecording } = useSpeechRecognition({
  language: speechLanguage,
  continuous: true,
  interimResults: true,
  onSpeechFinished: appendDictatedText,
  onSpeechTemporary: (text) => {
    speechTemporary.value = text
  },
})

const openRamblePopup = () => {
  if (!rambleText.value && assistantText.value) {
    rambleText.value = assistantText.value
  }
  showRamblePopup.value = true
}

const closeRamblePopup = () => {
  stopRecording()
  showRamblePopup.value = false
}

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
    return
  }

  startRecording()
}

const normalizeName = (value) => LanguageUtils.removeAccentsAndLowerCase(value).trim()

const resolveByName = (list, getNames, name) => {
  const normalizedName = normalizeName(name)
  if (!normalizedName) {
    return null
  }

  const getNormalizedNames = (item) => getNames(item).filter(Boolean).map(normalizeName)
  const exactMatch = list.find((item) => getNormalizedNames(item).some((itemName) => itemName === normalizedName))
  if (exactMatch) {
    return exactMatch
  }

  return list.find((item) => getNormalizedNames(item).some((itemName) => itemName.length >= 3 && (itemName.includes(normalizedName) || normalizedName.includes(itemName))))
}

const uniqueById = (list) => {
  const result = []
  for (const item of list.filter(Boolean)) {
    if (!result.some((existing) => existing.id === item.id)) {
      result.push(item)
    }
  }
  return result
}

const resolveTags = (tagNames = []) => {
  return uniqueById(tagNames.map((tagName) => resolveByName(tagStore.tagList, (tag) => [Tag.getDisplayName(tag)], tagName)))
}

const resolveCategory = (categoryName) => {
  return resolveByName(categoryStore.categoryList, (category) => [Category.getDisplayName(category)], categoryName)
}

const resolveTemplate = (templateName) => {
  return resolveByName(templateStore.transactionTemplateList, (template) => TransactionTemplate.getAllNames(template), templateName)
}

const resolveBudget = (budgetName) => {
  return resolveByName(budgetStore.budgetList, (budget) => [Budget.getDisplayName(budget)], budgetName)
}

const resolveAccount = (accountName) => {
  return resolveByName(accountStore.accountList, (account) => [Account.getDisplayName(account)], accountName)
}

const resolveCurrency = (currencyCode) => {
  return resolveByName(currencyStore.currenciesList, (currency) => [Currency.getCode(currency), Currency.getName(currency), Currency.getSymbol(currency)], currencyCode)
}

const resolveDate = (date) => {
  if (!date) {
    return null
  }

  const result = new Date(date)
  return Number.isNaN(result.getTime()) ? null : result
}

const resolveTransactionType = (type) => {
  return Transaction.typesList.find((transactionType) => transactionType.code === type) ?? null
}

const contextNames = (list, getNames) => {
  return list
    .map((item) => getNames(item))
    .flat()
    .filter(Boolean)
    .slice(0, 200)
}

const getRambleContext = () => ({
  tags: contextNames(tagStore.tagList, (tag) => [Tag.getDisplayName(tag)]),
  categories: contextNames(categoryStore.categoryList, (category) => [Category.getDisplayName(category)]),
  templates: contextNames(templateStore.transactionTemplateList, (template) => TransactionTemplate.getAllNames(template)),
  budgets: contextNames(budgetStore.budgetList, (budget) => [Budget.getDisplayName(budget)]),
  accounts: contextNames(accountStore.accountList, (account) => [Account.getDisplayName(account)]),
  currencies: contextNames(currencyStore.currenciesList, (currency) => [Currency.getCode(currency), Currency.getName(currency), Currency.getSymbol(currency)]),
})

const getRambleLlmSettings = () => {
  const settings = {
    endpoint: profileStore.assistantRambleEndpoint?.trim(),
    model: profileStore.assistantRambleModel?.trim(),
    apiKey: profileStore.assistantRambleApiKey?.trim(),
  }

  return Object.fromEntries(Object.entries(settings).filter(([, value]) => value))
}

const getRambleErrorMessage = (error) => {
  return error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.message ?? 'Assistant LLM request failed.'
}

const resolveAssistantAccount = (accountName) => {
  return accountName ? (resolveAccount(accountName) ?? undefined) : undefined
}

const resolveRambleTransaction = (rawTransaction, index) => {
  const template = resolveTemplate(rawTransaction.templateName)
  const tags = resolveTags(rawTransaction.tagNames)
  const category = resolveCategory(rawTransaction.categoryName)
  const budget = resolveBudget(rawTransaction.budgetName)
  const type = resolveTransactionType(rawTransaction.type)
  const fixedAccounts = Transaction.attemptAccountFixOnTypeChange(
    type ?? Transaction.types.expense,
    resolveAssistantAccount(rawTransaction.sourceAccountName) ?? profileStore.defaultAccountSource,
    resolveAssistantAccount(rawTransaction.destinationAccountName) ?? profileStore.defaultAccountDestination,
  )
  const assistantCurrency = resolveCurrency(rawTransaction.currencyCode)
  const rawDescription = rawTransaction.description ?? rawTransaction.templateName ?? rawTransaction.categoryName ?? rawTransaction.tagNames?.[0]

  return {
    id: `${Date.now()}-${index}`,
    raw: rawTransaction,
    transactionTemplate: template,
    tags,
    category,
    budget,
    accountSource: fixedAccounts.source,
    accountDestination: fixedAccounts.destination,
    type,
    amount: rawTransaction.amount === null || rawTransaction.amount === undefined ? null : rawTransaction.amount.toString(),
    assistantCurrency,
    currencyCode: rawTransaction.currencyCode,
    description: rawDescription ?? '',
    notes: rawTransaction.notes,
    date: resolveDate(rawTransaction.occurredAt),
  }
}

const interpretRambleText = async () => {
  const text = rambleText.value.trim()
  if (!text) {
    return
  }

  stopRecording()
  isInterpreting.value = true
  hasInterpreted.value = false
  rambleError.value = ''

  try {
    const response = await new AssistantRepository().interpretTransactions({
      text,
      now: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: profileStore.language,
      context: getRambleContext(),
      llm: getRambleLlmSettings(),
    })

    rambleTransactions.value = (response.transactions ?? []).map(resolveRambleTransaction)
    hasInterpreted.value = true
  } catch (error) {
    rambleTransactions.value = []
    rambleError.value = getRambleErrorMessage(error)
    hasInterpreted.value = true
  } finally {
    isInterpreting.value = false
  }
}

const formatRambleAmount = (transaction) => {
  return [transaction.amount, transaction.currencyCode].filter(Boolean).join(' ')
}

const getAccountDisplayName = (account) => {
  return account ? Account.getDisplayName(account) : null
}

const getRambleAccountSummary = (transaction) => {
  const source = getAccountDisplayName(transaction.accountSource) ?? transaction.raw.sourceAccountName
  const destination = getAccountDisplayName(transaction.accountDestination) ?? transaction.raw.destinationAccountName

  if (source && destination) {
    return `${source} -> ${destination}`
  }

  return source ?? destination ?? null
}

const getRamblePreviewTags = (transaction) => {
  return [
    { label: t('template'), value: transaction.transactionTemplate ? TransactionTemplate.getDisplayName(transaction.transactionTemplate) : transaction.raw.templateName },
    { label: t('tag'), value: transaction.tags.length > 0 ? transaction.tags.map((tag) => Tag.getDisplayNameEllipsized(tag)).join(', ') : transaction.raw.tagNames?.join(', ') },
    { label: t('category'), value: transaction.category ? Category.getDisplayName(transaction.category) : transaction.raw.categoryName },
    { label: t('budget'), value: transaction.budget ? Budget.getDisplayName(transaction.budget) : transaction.raw.budgetName },
    { label: t('account'), value: getRambleAccountSummary(transaction) },
    { label: t('date'), value: transaction.date ? DateUtils.dateToUIWithTime(transaction.date) : null },
    { label: t('notes'), value: transaction.notes ? ellipsizeText(transaction.notes, 24) : null },
  ].filter((previewTag) => !!previewTag.value)
}

const applyFirstRambleTransaction = () => {
  const firstTransaction = rambleTransactions.value[0]
  if (!firstTransaction) {
    return
  }

  emit('change', firstTransaction)
  closeRamblePopup()
}

const createRambleTransactions = () => {
  if (rambleTransactions.value.length === 0) {
    return
  }

  emit('create-many', rambleTransactions.value)
  closeRamblePopup()
}

watch([parsed, () => profileStore.assistantCurrency, () => profileStore.profileActiveId], ([newParsed, newAssistantCurrency]) => {
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
})

watch(showRamblePopup, (newValue) => {
  if (!newValue) {
    stopRecording()
  }
})
</script>
