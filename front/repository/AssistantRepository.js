import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository'

const DEFAULT_ASSISTANT_LLM_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_ASSISTANT_LLM_MODEL = 'gpt-4o-mini'
const assistantLlmClient = axios.create()

const getInterpretationPrompt = () =>
  [
    'You extract financial transactions from natural language.',
    'Return only one JSON object, with no markdown and no commentary.',
    'The JSON object must have a transactions array.',
    'Each transaction must use this shape:',
    '{"amount": number|null, "currencyCode": string|null, "description": string|null, "tagNames": string[], "categoryName": string|null, "templateName": string|null, "budgetName": string|null, "sourceAccountName": string|null, "destinationAccountName": string|null, "type": "expense|income|transfer|null", "occurredAt": string|null, "notes": string|null}',
    'Split one utterance into multiple transactions when the user says "another", "and one", "plus", or otherwise describes more than one payment.',
    'Use the provided now and timezone to resolve relative dates and times such as yesterday, today, 30 minutes ago, or last Friday.',
    'Use ISO-8601 for occurredAt when a date or relative time is stated. If only a date is stated, keep the current local time from now.',
    'Use ISO 4217 codes for currencyCode, for example EUR, USD, RON. Leave currencyCode null when the user did not state a currency.',
    'Do not invent local resource names. Only set tagNames, categoryName, templateName, budgetName, sourceAccountName, or destinationAccountName when the user explicitly asks for them or the name is present in the supplied context.',
    'If a user says "tag food", put food in tagNames. If they say "for pharmacy", use pharmacy as description unless it clearly matches a supplied tag, category, or template.',
    'Prefer type expense unless the user clearly describes income or a transfer.',
  ].join('\n')

const tryParseJson = (content) => {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

const decodeJsonContent = (content) => {
  if (!content || typeof content !== 'string') {
    return null
  }

  content = content.trim()
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  const decoded = tryParseJson(content)
  if (decoded !== null) {
    return decoded
  }

  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  return jsonMatch ? tryParseJson(jsonMatch[1]) : null
}

const normalizeTransactions = (json) => {
  if (!json || typeof json !== 'object') {
    return []
  }

  const transactions = Array.isArray(json) ? json : Array.isArray(json.transactions) ? json.transactions : [json]

  return transactions
    .filter((transaction) => transaction && typeof transaction === 'object' && !Array.isArray(transaction))
    .map((transaction) => {
      let date = transaction.occurredAt ?? transaction.occurred_at ?? null
      if (!date && transaction.date) {
        date = `${transaction.date}T${transaction.time ?? '00:00'}`.trim()
      }

      let tags = transaction.tagNames ?? transaction.tag_names ?? transaction.tags ?? []
      if (typeof tags === 'string') {
        tags = [tags]
      }

      return {
        amount: transaction.amount ?? null,
        currencyCode: transaction.currencyCode ?? transaction.currency_code ?? transaction.currency ?? null,
        description: transaction.description ?? null,
        tagNames: Array.isArray(tags) ? tags.filter(Boolean) : [],
        categoryName: transaction.categoryName ?? transaction.category_name ?? transaction.category ?? null,
        templateName: transaction.templateName ?? transaction.template_name ?? transaction.template ?? null,
        budgetName: transaction.budgetName ?? transaction.budget_name ?? transaction.budget ?? null,
        sourceAccountName: transaction.sourceAccountName ?? transaction.source_account_name ?? transaction.source_account ?? null,
        destinationAccountName: transaction.destinationAccountName ?? transaction.destination_account_name ?? transaction.destination_account ?? null,
        type: transaction.type ?? null,
        occurredAt: date,
        notes: transaction.notes ?? null,
      }
    })
}

export default class AssistantRepository extends BaseRepository {
  constructor() {
    super('api/assistant')
  }

  async saveRambleText(text) {
    return axios.post(`${this.getUrl()}/rambles`, text, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  async getSavedRambleCount({ showLoading = false } = {}) {
    const response = await axios.get(`${this.getUrl()}/rambles/count`, { showLoading })
    return get(response, 'data', {})
  }

  async getSavedRambles() {
    const response = await axios.get(`${this.getUrl()}/rambles`)
    return get(response, 'data', {})
  }

  async deleteSavedRamble(id) {
    return axios.delete(`${this.getUrl()}/rambles/${id}`)
  }

  async deleteSavedRambles(ids) {
    return axios.delete(`${this.getUrl()}/rambles`, {
      data: {
        ids,
      },
    })
  }

  async interpretTransactions(data) {
    const llm = data.llm ?? {}
    const endpoint = llm.endpoint?.trim() || DEFAULT_ASSISTANT_LLM_ENDPOINT
    const model = llm.model?.trim() || DEFAULT_ASSISTANT_LLM_MODEL
    const apiKey = llm.apiKey?.trim()

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const response = await assistantLlmClient.post(
      endpoint,
      {
        model,
        temperature: 0.1,
        stream: false,
        messages: [
          {
            role: 'system',
            content: getInterpretationPrompt(),
          },
          {
            role: 'user',
            content: JSON.stringify({
              text: data.text,
              now: data.now,
              timezone: data.timezone,
              language: data.language,
              context: data.context ?? {},
            }),
          },
        ],
      },
      {
        headers,
        timeout: 60000,
      },
    )

    const json = decodeJsonContent(get(response, 'data.choices.0.message.content'))
    if (json === null) {
      throw new Error('Assistant LLM did not return valid JSON.')
    }

    return {
      transactions: normalizeTransactions(json),
    }
  }
}
