<template>
  <d-form class="[--label-w:13.75rem]" @submit="save">
    <d-settings-group :title="$t('settings.assistant.title')">
      <d-field :label="$t('settings.assistant.auto_focus')">
        <d-switch v-model="draft.autoFocusAssistant" />
      </d-field>
      <d-field :label="$t('settings.assistant.substring_todo_tag')">
        <d-input v-model="draft.assistantTodoTagMatcher" class="w-40" />
      </d-field>
      <d-field :label="$t('settings.assistant.currency')">
        <div class="max-w-80">
          <d-currency-select v-model="draft.assistantCurrency" clearable />
        </div>
      </d-field>
    </d-settings-group>

    <!-- One group per connection: the server's ASSISTANT_* variables or the user's own endpoint + key + model -->
    <d-settings-group v-for="group in groups" :key="group.key">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <h3 class="text-sm font-semibold">{{ $t(group.title) }}</h3>
          <p class="text-[13px] text-dim">{{ $t(group.subtitle) }}</p>
        </div>
        <d-badge :variant="badges[group.source].variant">{{ $t(badges[group.source].t) }}</d-badge>
      </div>

      <d-field :label="$t('settings.assistant.source_label')">
        <d-tabs v-model="connection[group.useOwn]" sm :options="sourceOptions" />
      </d-field>

      <template v-if="group.source === 'server'">
        <dl class="flex flex-col rounded-lg border border-line text-sm">
          <div v-for="detail in group.serverDetails" :key="detail.t" class="flex items-center gap-2.5 border-line px-3 py-2.5 [&:not(:first-child)]:border-t">
            <dt class="w-36 shrink-0 text-dim">{{ $t(detail.t) }}</dt>
            <dd class="truncate" :class="{ 'font-mono text-[13px]': detail.mono }" :title="detail.value">{{ detail.value }}</dd>
          </div>
        </dl>
        <p class="text-[13px] text-dim">{{ $t('settings.assistant.server_managed') }}</p>
      </template>

      <d-info v-else-if="group.source === 'none'" stacked>
        <b class="font-medium">{{ $t(group.missingTitle) }}</b>
        <span class="text-dim">{{ $t(group.missing) }}</span>
      </d-info>

      <template v-else>
        <d-field :label="$t('settings.assistant.endpoint')" :rules="[rule.required()]" :value="connection[group.endpoint]">
          <d-input v-model="connection[group.endpoint]" type="url" class="font-mono" :placeholder="group.endpointPlaceholder" />
        </d-field>
        <d-field :label="$t('settings.assistant.api_key')" :hint="$t('settings.assistant.key_hint')">
          <div class="flex items-center gap-2">
            <d-input v-model="connection[group.apiKey]" type="password" class="flex-1 font-mono" :placeholder="connection[group.hasApiKey] ? $t('settings.assistant.key_saved_placeholder') : 'sk-…'" />
            <d-button v-if="connection[group.hasApiKey]" variant="ghost" size="sm" @click="clearApiKey(group.key)">{{ $t('settings.assistant.remove_key') }}</d-button>
          </div>
        </d-field>
        <d-field :label="$t('settings.assistant.model')">
          <d-input v-model="connection[group.model]" class="max-w-80 font-mono" :placeholder="$t('settings.assistant.model_default', { model: group.defaultModel })" />
        </d-field>
        <d-field v-if="group.language" :label="$t('settings.assistant.language')" :hint="$t('settings.assistant.transcription_language_info')">
          <d-input v-model="connection[group.language]" class="w-40 font-mono" :placeholder="$t('settings.assistant.language_auto')" />
        </d-field>
        <d-info stacked>
          <b class="font-medium">{{ $t('settings.assistant.own_note_title') }}</b>
          <span class="text-dim">{{ $t(group.ownNote) }}</span>
        </d-info>
      </template>

      <template v-if="group.key === 'llm'">
        <d-field :label="$t('settings.assistant.llm_context')" :hint="$t('settings.assistant.context_hint')" top>
          <d-textarea v-model="draft.assistantLlmContext" :placeholder="$t('settings.assistant.llm_context_placeholder')" />
        </d-field>
        <d-field :label="$t('settings.assistant.history_label')" :hint="historyHelp">
          <d-tabs v-model="draft.assistantHistoryCount" sm :options="historyOptions" />
        </d-field>
      </template>

      <div v-if="group.source !== 'none'" class="flex flex-wrap gap-2">
        <d-button size="sm" :icon="group.testIcon" :loading="testing[group.key]" @click="group.test">{{ $t(group.testLabel) }}</d-button>
        <d-button v-if="group.key === 'llm'" size="sm" :icon="IconFlask" @click="isTryOpen = true">{{ $t('settings.assistant.try_open') }}</d-button>
      </div>
    </d-settings-group>

    <d-settings-actions :loading="isSaving || isSavingConnection" @reset="onReset" />

    <!-- Try it out: a sample run with the settings on this page, nothing is saved -->
    <d-dialog :open="isTryOpen" :title="$t('settings.assistant.try_open')" :description="$t('settings.assistant.try_desc')" size="xl" @close="isTryOpen = false">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <d-textarea v-model="tryIt.text.value" :rows="2" :placeholder="$t('settings.assistant.try_placeholder')" />
          <div class="flex flex-wrap items-center gap-2">
            <d-button variant="primary" size="sm" :icon="IconPlayerPlay" :loading="tryIt.isRunning.value" :disabled="!tryIt.text.value.trim()" @click="tryIt.run">
              {{ tryIt.isRunning.value ? $t('settings.assistant.try_running') : $t('settings.assistant.try_run') }}
            </d-button>
            <span class="text-[13px] text-dim">{{ tryUses }}</span>
          </div>
        </div>

        <div v-if="!run" class="flex items-center gap-2.5 rounded-lg border border-dashed border-line p-4 text-[13px] text-dim">
          <IconFlask :size="18" />
          {{ $t('settings.assistant.try_empty') }}
        </div>

        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-1.5">
              <d-button
                v-for="(item, index) in tryIt.runs.value"
                :key="item.id"
                size="xs"
                :variant="index === tryIt.activeIndex.value ? 'secondary' : 'ghost'"
                @click="tryIt.activeIndex.value = index"
              >
                {{ $t('settings.assistant.try_run_label', { n: item.id, history: item.historyCount || $t('settings.assistant.history_off') }) }}
              </d-button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <d-badge :variant="run.matched === run.total ? 'success' : 'warning'">{{ $t('settings.assistant.try_matched', { matched: run.matched, total: run.total }) }}</d-badge>
              <d-badge v-if="run.durationMs" variant="outline">{{ (run.durationMs / 1000).toFixed(2) }} s</d-badge>
              <d-badge variant="outline">{{ $t('settings.assistant.try_tokens', { in: run.tokensIn, out: run.tokensOut ?? '—' }) }}</d-badge>
              <d-badge variant="outline" class="font-mono">{{ run.model }}</d-badge>
            </div>
          </div>

          <d-tabs v-model="tryView" sm :options="tryViewOptions" />

          <div v-if="tryView === 'result'" class="grid gap-3 sm:grid-cols-2">
            <div v-for="(result, index) in run.results" :key="index" class="overflow-hidden rounded-lg border border-line">
              <div class="flex items-center gap-2 bg-soft/40 px-3 py-2.5 text-sm">
                <IconReceipt :size="16" class="text-dim" />
                <b class="font-semibold">{{ result.description }}</b>
                <span class="ml-auto font-semibold tabular-nums">{{ result.amount ?? '—' }} {{ result.currency ?? '' }}</span>
              </div>
              <div v-for="field in result.fields" :key="field.key" class="grid grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-line px-3 py-2 text-sm">
                <span class="text-dim">{{ $t(`settings.assistant.try_field_${field.key}`) }}</span>
                <span class="truncate">{{ field.value }}</span>
                <d-badge :variant="statusVariant[field.status]">{{ $t(`settings.assistant.try_status_${field.status}`) }}</d-badge>
              </div>
            </div>
          </div>

          <template v-else-if="tryView === 'prompt'">
            <div class="overflow-hidden rounded-lg border border-line">
              <div v-for="section in run.sections" :key="section.key" class="[&:not(:first-child)]:border-t [&:not(:first-child)]:border-line">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-soft/40"
                  :aria-expanded="!!openSections[section.key]"
                  @click="openSections[section.key] = !openSections[section.key]"
                >
                  <component :is="openSections[section.key] ? IconChevronDown : IconChevronRight" :size="14" class="text-dim" />
                  <span class="font-medium">{{ $t(`settings.assistant.try_section_${section.key}`) }}</span>
                  <d-badge class="ml-auto">{{ section.tokens ? `${section.tokens} tok` : '—' }}</d-badge>
                </button>
                <pre v-if="openSections[section.key]" class="max-h-72 overflow-auto bg-soft/40 px-3 py-2.5 font-mono text-[12.5px] leading-[18px] whitespace-pre-wrap">{{
                  section.body || $t('settings.assistant.try_section_empty')
                }}</pre>
              </div>
            </div>
            <p class="text-[13px] text-dim">{{ $t('settings.assistant.try_prompt_note', { tokens: run.tokensIn }) }}</p>
          </template>

          <pre v-else class="max-h-96 overflow-auto rounded-lg border border-line bg-soft/40 px-3 py-2.5 font-mono text-[12.5px] leading-[18px] whitespace-pre-wrap">{{ run.raw }}</pre>
        </template>
      </div>

      <template #footer>
        <d-button @click="isTryOpen = false">{{ $t('close') }}</d-button>
      </template>
    </d-dialog>
  </d-form>
</template>

<script setup>
import { IconChevronDown, IconChevronRight, IconFlask, IconMicrophone, IconPlayerPlay, IconReceipt, IconWand } from '@tabler/icons-vue'
import { rule } from '~/core/utils/ValidationUtils.js'
import { useAssistantSettings } from '~/core/composables/useAssistantSettings'
import { useAssistantTryIt } from '~/core/composables/useAssistantTryIt'

const { t } = useI18n()

const {
  draft: connection,
  server,
  isSaving: isSavingConnection,
  testing,
  load,
  save: saveConnection,
  clearApiKey,
  llmOverride,
  llmSource,
  transcriptionSource,
  llmModelInUse,
  testLlm,
  testTranscription,
} = useAssistantSettings()

// Saving the page saves the profile settings and the assistant connections together
const { draft, save, reset, isSaving } = useSettingsDraft(['autoFocusAssistant', 'assistantTodoTagMatcher', 'assistantCurrency', 'assistantLlmContext', 'assistantHistoryCount'], {
  onSaved: saveConnection,
})
const onReset = () => {
  reset()
  load()
}

const sourceOptions = computed(() => [
  { label: t('settings.assistant.source_server'), value: false },
  { label: t('settings.assistant.source_own'), value: true },
])
const badges = {
  server: { variant: 'success', t: 'settings.assistant.source_server' },
  own: { variant: 'primary', t: 'settings.assistant.badge_own' },
  none: { variant: 'secondary', t: 'settings.assistant.llm_not_configured' },
}

const groups = computed(() => [
  {
    key: 'llm',
    title: 'settings.assistant.llm_status',
    subtitle: 'settings.assistant.llm_status_subtitle',
    source: llmSource.value,
    useOwn: 'llmUseOwn',
    endpoint: 'llmEndpoint',
    apiKey: 'llmApiKey',
    hasApiKey: 'llmHasApiKey',
    model: 'llmModel',
    defaultModel: 'gpt-4o-mini',
    endpointPlaceholder: 'https://api.openai.com/v1/chat/completions',
    serverDetails: [
      { t: 'settings.assistant.endpoint', value: server.value.llm?.endpoint, mono: true },
      { t: 'settings.assistant.model', value: server.value.llm?.model, mono: true },
      { t: 'settings.assistant.api_key', value: t('settings.assistant.key_set_on_server') },
    ],
    missingTitle: 'settings.assistant.server_missing_llm_title',
    missing: 'settings.assistant.server_missing_llm',
    ownNote: 'settings.assistant.own_note_llm',
    testLabel: 'settings.assistant.llm_test',
    testIcon: IconWand,
    test: testLlm,
  },
  {
    key: 'transcription',
    title: 'settings.assistant.transcription_status',
    subtitle: 'settings.assistant.transcription_status_subtitle',
    source: transcriptionSource.value,
    useOwn: 'transcriptionUseOwn',
    endpoint: 'transcriptionEndpoint',
    apiKey: 'transcriptionApiKey',
    hasApiKey: 'transcriptionHasApiKey',
    model: 'transcriptionModel',
    language: 'transcriptionLanguage',
    defaultModel: 'gpt-4o-mini-transcribe',
    endpointPlaceholder: 'https://api.openai.com/v1/audio/transcriptions',
    serverDetails: [
      { t: 'settings.assistant.endpoint', value: server.value.transcription?.endpoint, mono: true },
      { t: 'settings.assistant.model', value: server.value.transcription?.model, mono: true },
      { t: 'settings.assistant.language', value: server.value.transcription?.language || t('settings.assistant.language_auto') },
      { t: 'settings.assistant.api_key', value: t('settings.assistant.key_set_on_server') },
    ],
    missingTitle: 'settings.assistant.server_missing_transcription_title',
    missing: 'settings.assistant.server_missing_transcription',
    ownNote: 'settings.assistant.own_note_transcription',
    testLabel: 'settings.assistant.transcription_test',
    testIcon: IconMicrophone,
    test: testTranscription,
  },
])

const historyOptions = computed(() => [{ label: t('settings.assistant.history_off'), value: 0 }, ...[25, 50, 100].map((value) => ({ label: String(value), value }))])
// ~28 tokens per history line
const historyHelp = computed(() =>
  draft.assistantHistoryCount ? t('settings.assistant.history_help_on', { count: draft.assistantHistoryCount, tokens: draft.assistantHistoryCount * 28 }) : t('settings.assistant.history_help_off'),
)

// ----- Try it out -----
const isTryOpen = ref(false)
const tryView = ref('result')
const tryViewOptions = computed(() => ['result', 'prompt', 'raw'].map((value) => ({ label: t(`settings.assistant.try_tab_${value}`), value })))
const openSections = ref({})
const statusVariant = { matched: 'success', new: 'info', unmatched: 'warning', none: 'secondary' }
const tryIt = useAssistantTryIt({
  llmOverride,
  llmContext: () => draft.assistantLlmContext,
  historyCount: () => draft.assistantHistoryCount,
  modelInUse: llmModelInUse,
})
const run = computed(() => tryIt.activeRun.value)
const tryUses = computed(() =>
  t('settings.assistant.try_uses', {
    model: llmModelInUse.value,
    source: t(llmSource.value === 'own' ? 'settings.assistant.try_source_own' : 'settings.assistant.try_source_server'),
    history: draft.assistantHistoryCount || t('settings.assistant.history_off'),
  }),
)

onMounted(load)
</script>
