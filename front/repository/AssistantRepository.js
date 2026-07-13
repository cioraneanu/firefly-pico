import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository'

const getInterpretationPrompt = () =>
  [
    'You extract financial transactions from natural language.',
    'Return only one JSON object, with no markdown and no commentary.',
    'The JSON object must have a transactions array.',
    'Each transaction must use this shape:',
    '{"amount": number|null, "currencyCode": string|null, "description": string, "tagNames": string[], "categoryName": string|null, "templateName": string|null, "budgetName": string|null, "sourceAccountName": string|null, "destinationAccountName": string|null, "type": "expense|income|transfer|null", "occurredAt": string|null, "notes": string|null}',
    'description is required for every transaction and must never be null or empty. It must be a short noun phrase (1-4 words) naming the merchant, place, item, or service, kept in the user\'s language. Strip verbs, actions, and filler words: "Am cumparat de la farmacie de 22 lei" gives description "farmacie", "bought some groceries at Lidl" gives "Lidl". Never include amounts or currencies. When the user does not state a subject, derive the description from the category, tag, or template that best summarizes the transaction.',
    'Split one utterance into multiple transactions when the user says "another", "and one", "plus", or otherwise describes more than one payment.',
    'Use the provided now and timezone to resolve relative dates and times such as yesterday, today, 30 minutes ago, or last Friday.',
    'Saved rambles include their original createdAt timestamp. Resolve their implicit dates relative to createdAt, not now.',
    'Use ISO-8601 for occurredAt when a date or relative time is stated. If only a date is stated, keep the current local time from now.',
    'Use ISO 4217 codes for currencyCode, for example EUR, USD, RON. Leave currencyCode null when the user did not state a currency.',
    'Actively match every meaningful word of the input against the supplied context lists (tags, categories, templates, budgets, accounts). Matching is forgiving: ignore case, diacritics, word order, singular/plural, and other inflections, and accept close partial matches ("comand" matches "comandate"). Fill every field that has a match: a matching tag goes in tagNames, a matching category in categoryName, a matching template in templateName, and so on. The same word may match several lists at once; set all of the matching fields.',
    'For terse inputs like "<word> <amount>", treat the word as the transaction subject: use it as the description and match it against the context lists to fill tagNames, categoryName, or templateName.',
    'Do not invent names that are missing from the supplied context. When a word matches nothing there, attempt to figure out what the user did based on his lists (Example for text = "Bought an air conditionar", and you could match it to a tag named "home", or "electronics"). If you are not sure about your guess just leave non essential fields null. If the user explicitly says "tag food", put food in tagNames even without a context match.',
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

  async getSavedRambleCount({ showLoading = false } = {}) {
    const response = await axios.get(`${this.getUrl()}/rambles/count`, { showLoading })
    return get(response, 'data', {})
  }

  async getSavedRambles() {
    const response = await axios.get(`${this.getUrl()}/rambles`)
    return get(response, 'data', {})
  }

  async getSavedRambleVoice(id) {
    const response = await axios.get(`${this.getUrl()}/rambles/${id}/voice`, { responseType: 'blob' })
    return get(response, 'data', null)
  }

  async deleteSavedRambles(ids) {
    return axios.delete(`${this.getUrl()}/rambles`, {
      data: {
        ids,
      },
    })
  }

  async deleteSavedRamble(id) {
    return axios.delete(`${this.getUrl()}/rambles/${id}`)
  }

  async interpretTransactions(data) {
    const requestData = {
      context: data.externalContext,
      payload: {
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
              savedRambles: data.savedRambles ?? [],
              now: data.now,
              timezone: data.timezone,
              language: data.language,
              context: data.context ?? {},
            }),
          },
        ],
      },
    }

    const response = await axios.post(`${this.getUrl()}/interpret-transactions`, requestData, {
      timeout: 60000,
    })

    if (!response || response.status >= 400) {
      throw new Error(get(response, 'data.message') ?? 'Assistant LLM request failed.')
    }

    const json = decodeJsonContent(get(response, 'data.choices.0.message.content') ?? get(response, 'data.content'))
    if (json === null) {
      throw new Error('Assistant LLM did not return valid JSON.')
    }

    return {
      transactions: normalizeTransactions(json),
    }
  }

  async testLlm() {
    return axios.post(`${this.getUrl()}/test-llm`, {}, { timeout: 60000 })
  }

  async testTranscription() {
    return axios.post(`${this.getUrl()}/test-transcription`, {}, { timeout: 120000 })
  }
}
