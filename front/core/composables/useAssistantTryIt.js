import { get } from 'lodash-es'
import AssistantRepository from '~/core/repository/AssistantRepository'
import { withAssistantHistory } from '~/core/composables/useAssistantHistory'
import { useRambleTransactionResolver } from '~/core/composables/useRambleTransactionResolver'

// "Try it out" on Settings · Assistant: runs a sample through the LLM with the settings on the screen (saved or not),
// nothing is saved to Firefly. Each run keeps the resolved transactions, the exact prompt (split into sections) and
// the raw response. The last 3 runs stay so the user can compare them.
const estimateTokens = (text) => Math.ceil(String(text ?? '').length / 4)

const splitSystemPrompt = (content) => {
  const [base, rest = ''] = String(content ?? '').split(/\n(?=Backend context \(default\):|Frontend context \(higher priority\):)/)
  const serverMatch = rest.match(/Backend context \(default\):\n([\s\S]*?)(?=\n\nFrontend context|$)/)
  const userMatch = rest.match(/Frontend context \(higher priority\):\n([\s\S]*)/)
  return { base, server: serverMatch?.[1] ?? '', user: userMatch?.[1] ?? '' }
}

export function useAssistantTryIt({ llmOverride, llmContext, historyCount, modelInUse, source }) {
  const { t } = useI18n()
  const profileStore = useProfileStore()
  const repository = new AssistantRepository()
  const { getRambleContext, resolveRambleTransaction } = useRambleTransactionResolver()

  const text = ref('')
  const runs = ref([])
  const activeIndex = ref(-1)
  const isRunning = ref(false)
  let sequence = 0

  const activeRun = computed(() => runs.value[activeIndex.value] ?? null)
  const uses = computed(() =>
    t('settings.assistant.try_uses', {
      model: toValue(modelInUse),
      source: t(toValue(source) === 'own' ? 'settings.assistant.try_source_own' : 'settings.assistant.try_source_server'),
      history: toValue(historyCount) || t('settings.assistant.history_off'),
    }),
  )

  const field = (key, value, status) => ({ key, value: value || '—', status: value ? status : 'none' })

  const toResult = (transaction) => {
    const raw = transaction.raw
    const name = (item) => get(item, 'attributes.name')
    return {
      description: transaction.description,
      type: get(transaction, 'type.code') ?? 'expense',
      amount: transaction.amount,
      currency: transaction.currencyCode,
      fields: [
        field('date', transaction.date ? DateUtils.dateToUI(transaction.date) : null, 'matched'),
        field('source', name(transaction.accountSource) ?? raw.sourceAccountName, transaction.accountSource ? 'matched' : 'new'),
        field('destination', name(transaction.accountDestination) ?? raw.destinationAccountName, transaction.accountDestination ? 'matched' : 'new'),
        field('category', name(transaction.category) ?? raw.categoryName, transaction.category ? 'matched' : 'unmatched'),
        field('budget', name(transaction.budget) ?? raw.budgetName, transaction.budget ? 'matched' : 'unmatched'),
        field('tags', (transaction.tags ?? []).map((tag) => get(tag, 'attributes.tag')).join(', ') || raw.tagNames.join(', '), transaction.tags?.length ? 'matched' : 'unmatched'),
      ],
    }
  }

  const toSections = (messages) => {
    const system = (messages ?? []).find((message) => message.role === 'system')?.content
    const user = (messages ?? []).find((message) => message.role === 'user')?.content
    const prompt = splitSystemPrompt(system)
    let userJson = {}
    try {
      userJson = JSON.parse(user ?? '{}')
    } catch {
      userJson = {}
    }
    const { recentTransactions = [], ...lists } = userJson.context ?? {}
    const message = { ...userJson, context: undefined }
    const section = (key, body, extra = {}) => ({ key, body: body || '', tokens: body ? estimateTokens(body) : 0, ...extra })
    return [
      section('rules', prompt.base),
      section('server_context', prompt.server),
      section('user_context', prompt.user),
      section(
        'entities',
        Object.entries(lists)
          .map(([key, values]) => `${key}: ${(values ?? []).join(' · ')}`)
          .join('\n'),
        { count: Object.values(lists).reduce((sum, values) => sum + (values?.length ?? 0), 0) },
      ),
      section('history', recentTransactions.join('\n'), { count: recentTransactions.length }),
      section('message', JSON.stringify(message, null, 2)),
    ]
  }

  const run = async () => {
    if (!text.value.trim() || isRunning.value) {
      return
    }
    isRunning.value = true
    const context = await withAssistantHistory(getRambleContext(), toValue(historyCount))
    try {
      const response = await repository.interpretTransactions({
        text: text.value.trim(),
        savedRambles: [],
        now: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: profileStore.language,
        externalContext: toValue(llmContext),
        context,
        config: toValue(llmOverride),
        debug: true,
      })
      const results = (response.transactions ?? []).map(resolveRambleTransaction).map(toResult)
      const sections = toSections(response.debug?.messages)
      const counted = results.flatMap((result) => result.fields.filter((item) => item.key !== 'date' && item.status !== 'none'))
      runs.value = [
        ...runs.value,
        {
          id: ++sequence,
          historyCount: Number(toValue(historyCount)) || 0,
          results,
          sections,
          raw: JSON.stringify(response.debug?.raw ?? response.transactions, null, 2),
          matched: counted.filter((item) => item.status === 'matched').length,
          total: counted.length,
          durationMs: response.debug?.duration_ms ?? null,
          tokensIn: get(response, 'debug.usage.prompt_tokens') ?? sections.reduce((sum, item) => sum + item.tokens, 0),
          tokensOut: get(response, 'debug.usage.completion_tokens') ?? null,
          model: response.debug?.model ?? toValue(modelInUse),
          source: response.debug?.source ?? null,
        },
      ].slice(-3)
      activeIndex.value = runs.value.length - 1
    } catch (exception) {
      UIUtils.showToastError(exception?.message ?? String(exception))
    } finally {
      isRunning.value = false
    }
  }

  return { text, runs, activeIndex, activeRun, isRunning, uses, run }
}
