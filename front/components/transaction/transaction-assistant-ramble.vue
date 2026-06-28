<template>
  <van-badge :content="savedRamblesCount" :show-zero="false">
    <van-button size="small" class="cursor-pointer" @click="openRamblePopup">
      <icon-wand :size="18" />
    </van-button>
  </van-badge>

  <app-popup v-model:show="showRamblePopup">
    <div class="display-flex flex-direction-column h-100 m-h-0">
      <div class="display-flex align-items-start gap-2 px-3 py-2 border-bottom">
        <div class="flex-1-w">
          <div class="font-600 text-size-16">{{ $t('transaction.assistant_ramble_title') }}</div>
          <div class="text-size-12 text-muted mt-5">
            {{ $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) }}
          </div>
          <div v-if="rambleTransactions.length > 0" class="text-size-12 text-muted mt-5">{{ $t('transaction.assistant_ramble_preview') }}</div>
        </div>

        <van-button size="small" class="cursor-pointer" @click="closeRamblePopup">
          <app-icon :icon="TablerIconConstants.close" :size="18" />
        </van-button>
      </div>

      <div class="flex-1 m-h-0 overflow-auto display-flex flex-direction-column gap-2 p-3">
        <van-cell-group inset class="no-margin overflow-hidden">
          <div class="flex-center-vertical gap-2">
            <div class="text-size-13">Type or use your microphone</div>
            <van-button :type="isRecording ? 'danger' : 'primary'" size="small" class="cursor-pointer" @click="toggleRecording">
              <app-icon :icon="isRecording ? TablerIconConstants.stop : TablerIconConstants.microphone" :size="16" />
            </van-button>

            <div v-if="speechTemporary" class="display-flex flex-center-vertical gap-1 text-size-12 text-muted px-3 pb-2">
              <app-icon :icon="TablerIconConstants.microphone" :size="14" />
              <span>{{ speechTemporary }}</span>
            </div>
          </div>
          <app-field
            v-model="rambleText"
            class="van-cell-no-padding compact mt-1"
            label=""
            type="textarea"
            rows="5"
            autosize
            :placeholder="$t('transaction.assistant_ramble_placeholder')"
            :clearable="true"
          />

          <div class="display-flex flex-center-vertical gap-2 mt-2">
            <div class="flex-1 text-size-12 text-muted">{{ $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) }}</div>
            <van-button size="small" plain class="cursor-pointer" :loading="isLoadingSavedRambles" @click="fetchSavedRambles">
              <app-icon :icon="TablerIconConstants.list" :size="16" />
              {{ $t('transaction.assistant_ramble_load_saved') }}
            </van-button>
          </div>

          <van-button type="" plain size="small" class="w-100 mt-2" :loading="isInterpreting" :disabled="!canInterpretRamble" @click="interpretRambleText">
            <app-icon :icon="TablerIconConstants.magic" :size="16" />
            {{ $t('transaction.assistant_ramble_interpret') }}
          </van-button>
        </van-cell-group>

        <div v-if="rambleError" class="text-size-12 text-danger px-3">{{ rambleError }}</div>

        <template v-if="savedRambles.length > 0">
          <div class="display-flex flex-direction-column gap-2">
            <van-cell-group v-for="(ramble, index) in savedRambles" :key="ramble.id" inset class="no-margin">
              <div class="display-flex align-items-start gap-2 p-10">
                <div class="tag-gray text-size-12">{{ index + 1 }}</div>
                <div class="flex-1-w text-size-13 word-break-word">{{ ramble.text }}</div>
                <van-button size="small" type="danger" plain class="cursor-pointer" :loading="deletingSavedRambleId === ramble.id" @click="deleteSavedRamble(ramble)">
                  <van-icon name="delete-o" size="16" />
                </van-button>
              </div>
            </van-cell-group>
          </div>
        </template>

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
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { IconWand } from '@tabler/icons-vue'
import Tag from '~/models/Tag'
import Category from '~/models/Category.js'
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Currency from '~/models/Currency.js'
import TransactionTemplate from '~/models/TransactionTemplate.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import LanguageUtils from '~/utils/LanguageUtils.js'
import { ellipsizeText } from '~/utils/Utils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AssistantRepository from '~/repository/AssistantRepository.js'
import * as LanguageConstants from '~/constants/LanguageConstants.js'
import { useSpeechRecognition } from '~/composables/useSpeechRecognition.js'

const props = defineProps({
  assistantText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change', 'create-many'])

const { t } = useI18n()
const profileStore = useProfileStore()
const tagStore = useTagStore()
const categoryStore = useCategoryStore()
const templateStore = useTemplateStore()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const currencyStore = useCurrencyStore()
const assistantRepository = new AssistantRepository()

const showRamblePopup = ref(false)
const rambleText = ref('')
const savedRambles = ref([])
const savedRamblesCount = ref(0)
const deletingSavedRambleId = ref(null)
const isLoadingSavedRambles = ref(false)
const rambleTransactions = ref([])
const speechTemporary = ref('')
const isInterpreting = ref(false)
const hasInterpreted = ref(false)
const rambleError = ref('')

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

const canInterpretRamble = computed(() => {
  return !!rambleText.value.trim() || savedRambles.value.length > 0
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

const isResponseSuccessful = (response) => {
  return response?.status >= 200 && response?.status < 300
}

const refreshSavedRambleCount = async ({ showLoading = false } = {}) => {
  const response = await assistantRepository.getSavedRambleCount({ showLoading })
  savedRamblesCount.value = response.count ?? savedRambles.value.length
}

const fetchSavedRambles = async () => {
  isLoadingSavedRambles.value = true

  try {
    const response = await assistantRepository.getSavedRambles()
    savedRambles.value = response.data ?? []
    savedRamblesCount.value = savedRambles.value.length
  } finally {
    isLoadingSavedRambles.value = false
  }
}

const deleteSavedRamble = async (ramble) => {
  deletingSavedRambleId.value = ramble.id

  try {
    const response = await assistantRepository.deleteSavedRamble(ramble.id)
    if (isResponseSuccessful(response)) {
      savedRambles.value = savedRambles.value.filter((savedRamble) => savedRamble.id !== ramble.id)
      await refreshSavedRambleCount({ showLoading: false })
    }
  } finally {
    deletingSavedRambleId.value = null
  }
}

const deleteProcessedSavedRambles = async () => {
  const processedIds = savedRambles.value.map((ramble) => ramble.id)
  if (processedIds.length === 0) {
    return
  }

  const response = await assistantRepository.deleteSavedRambles(processedIds)
  if (isResponseSuccessful(response)) {
    savedRambles.value = []
    await refreshSavedRambleCount({ showLoading: false })
  }
}

const openRamblePopup = async () => {
  if (!rambleText.value && props.assistantText) {
    rambleText.value = props.assistantText
  }

  showRamblePopup.value = true
  await refreshSavedRambleCount({ showLoading: false })
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

const getSavedRamblesText = () => {
  return savedRambles.value
    .map((ramble) => ramble.text?.trim())
    .filter(Boolean)
    .join('\n')
}

const getInterpretationText = () => {
  return [rambleText.value.trim(), getSavedRamblesText()].filter(Boolean).join('\n')
}

const interpretRambleText = async () => {
  const text = getInterpretationText()
  if (!text) {
    return
  }

  stopRecording()
  isInterpreting.value = true
  hasInterpreted.value = false
  rambleError.value = ''

  try {
    const response = await assistantRepository.interpretTransactions({
      text,
      now: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: profileStore.language,
      context: getRambleContext(),
      llm: getRambleLlmSettings(),
    })

    rambleTransactions.value = (response.transactions ?? []).map(resolveRambleTransaction)
    hasInterpreted.value = true
    await deleteProcessedSavedRambles()
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

watch(showRamblePopup, (newValue) => {
  if (!newValue) {
    stopRecording()
  }
})

onMounted(async () => {
  await refreshSavedRambleCount({ showLoading: false })
})
</script>
