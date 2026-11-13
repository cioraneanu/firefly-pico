<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card :section="$t('settings.general')">
          <app-boolean v-model="autoFocusAssistant" :label="$t('settings.assistant.auto_focus')" />
          <div class="mx-hr" />
          <app-field v-model="assistantTodoTagMatcher" name="assistantTodoTagMatcher" :label="$t('settings.assistant.substring_todo_tag')" :rules="[rule.required()]" />
          <currency-select v-model="assistantCurrency" :info="$t('settings.assistant.currency')" />
        </app-card>

        <!-- LLM: the server's connection or the user's own -->
        <app-card :title="$t('settings.assistant.llm_status')" :description="$t('settings.assistant.llm_status_subtitle')" :form="false">
          <template #actions>
            <span :class="badge(llmSource).cls">{{ badge(llmSource).text }}</span>
          </template>

          <div class="mx-seg" role="group" :aria-label="$t('settings.assistant.source_label')">
            <button type="button" :class="{ on: !draft.llmUseOwn }" :aria-pressed="!draft.llmUseOwn" @click="draft.llmUseOwn = false">{{ $t('settings.assistant.source_server') }}</button>
            <button type="button" :class="{ on: draft.llmUseOwn }" :aria-pressed="draft.llmUseOwn" @click="draft.llmUseOwn = true">{{ $t('settings.assistant.source_own') }}</button>
          </div>

          <template v-if="llmSource === 'server'">
            <div class="mx-kv mt-1.5">
              <div>
                <span>{{ $t('settings.assistant.endpoint') }}</span
                ><b>{{ server.llm?.endpoint }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.model') }}</span
                ><b>{{ server.llm?.model }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.api_key') }}</span
                ><b>{{ $t('settings.assistant.key_set_on_server') }}</b>
              </div>
            </div>
            <p class="mx-d">{{ $t('settings.assistant.server_managed') }}</p>
          </template>

          <div v-else-if="llmSource === 'none'" class="mx-note mt-3">
            <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
            <span>
              <b class="block" style="color: var(--foreground)">{{ $t('settings.assistant.server_missing_llm_title') }}</b>
              {{ $t('settings.assistant.server_missing_llm') }}
            </span>
          </div>

          <template v-else>
            <div class="mx-form p-0 mt-3">
              <app-field
                v-model="draft.llmEndpoint"
                name="llmEndpoint"
                type="url"
                :label="$t('settings.assistant.endpoint')"
                placeholder="https://api.openai.com/v1/chat/completions"
                :rules="[rule.required()]"
              />
              <app-field
                v-model="draft.llmApiKey"
                name="llmApiKey"
                type="password"
                :label="$t('settings.assistant.api_key')"
                :placeholder="draft.llmHasApiKey ? $t('settings.assistant.key_saved_placeholder') : 'sk-…'"
                :description="$t('settings.assistant.key_hint')"
              >
                <template #right>
                  <button v-if="draft.llmHasApiKey" type="button" class="mx-btn xs ghost" @click.prevent="clearApiKey('llm')">{{ $t('settings.assistant.remove_key') }}</button>
                </template>
              </app-field>
              <app-field v-model="draft.llmModel" name="llmModel" :label="$t('settings.assistant.model')" :placeholder="$t('settings.assistant.model_default', { model: DEFAULT_LLM_MODEL })" />
            </div>
            <div class="mx-note mt-3">
              <app-icon :icon="IconLock" :size="16" :stroke="2" />
              <span>
                <b class="block" style="color: var(--foreground)">{{ $t('settings.assistant.own_note_title') }}</b>
                {{ $t('settings.assistant.own_note_llm') }}
              </span>
            </div>
          </template>

          <div class="mx-hr my-3.5" />

          <app-text-area
            v-model="assistantLlmContext"
            :label="$t('settings.assistant.llm_context')"
            :placeholder="$t('settings.assistant.llm_context_placeholder')"
            :visible-lines="3"
            :description="$t('settings.assistant.context_hint')"
          />

          <div class="mx-f mt-3">
            <div class="mx-l">{{ $t('settings.assistant.history_label') }}</div>
            <div class="mx-seg" role="group" :aria-label="$t('settings.assistant.history_label')">
              <button
                v-for="option in historyOptions"
                :key="option.value"
                type="button"
                :class="{ on: assistantHistoryCount === option.value }"
                :aria-pressed="assistantHistoryCount === option.value"
                @click="assistantHistoryCount = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <p class="mx-d">{{ historyHelp }}</p>
          </div>

          <template v-if="llmSource !== 'none'">
            <button type="button" class="mx-btn out mx-btn-block mt-3" :disabled="testing.llm" @click="testLlm">
              <span v-if="testing.llm" class="mx-spin" />
              <app-icon v-else :icon="IconPlugConnected" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.llm_test') }}</span>
            </button>
            <button type="button" class="mx-btn out mx-btn-block mt-2" @click="isTryOpen = true">
              <app-icon :icon="IconFlask" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.try_open') }}</span>
            </button>
          </template>
        </app-card>

        <!-- Transcription: the server's connection or the user's own -->
        <app-card :title="$t('settings.assistant.transcription_status')" :description="$t('settings.assistant.transcription_status_subtitle')" :form="false">
          <template #actions>
            <span :class="badge(transcriptionSource).cls">{{ badge(transcriptionSource).text }}</span>
          </template>

          <div class="mx-seg" role="group" :aria-label="$t('settings.assistant.source_label')">
            <button type="button" :class="{ on: !draft.transcriptionUseOwn }" :aria-pressed="!draft.transcriptionUseOwn" @click="draft.transcriptionUseOwn = false">
              {{ $t('settings.assistant.source_server') }}
            </button>
            <button type="button" :class="{ on: draft.transcriptionUseOwn }" :aria-pressed="draft.transcriptionUseOwn" @click="draft.transcriptionUseOwn = true">
              {{ $t('settings.assistant.source_own') }}
            </button>
          </div>

          <template v-if="transcriptionSource === 'server'">
            <div class="mx-kv mt-1.5">
              <div>
                <span>{{ $t('settings.assistant.endpoint') }}</span
                ><b>{{ server.transcription?.endpoint }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.model') }}</span
                ><b>{{ server.transcription?.model }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.language') }}</span
                ><b>{{ server.transcription?.language || $t('settings.assistant.language_auto') }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.api_key') }}</span
                ><b>{{ $t('settings.assistant.key_set_on_server') }}</b>
              </div>
            </div>
            <p class="mx-d">{{ $t('settings.assistant.server_managed') }}</p>
          </template>

          <div v-else-if="transcriptionSource === 'none'" class="mx-note mt-3">
            <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
            <span>
              <b class="block" style="color: var(--foreground)">{{ $t('settings.assistant.server_missing_transcription_title') }}</b>
              {{ $t('settings.assistant.server_missing_transcription') }}
            </span>
          </div>

          <template v-else>
            <div class="mx-form p-0 mt-3">
              <app-field
                v-model="draft.transcriptionEndpoint"
                name="transcriptionEndpoint"
                type="url"
                :label="$t('settings.assistant.endpoint')"
                placeholder="https://api.openai.com/v1/audio/transcriptions"
                :rules="[rule.required()]"
              />
              <app-field
                v-model="draft.transcriptionApiKey"
                name="transcriptionApiKey"
                type="password"
                :label="$t('settings.assistant.api_key')"
                :placeholder="draft.transcriptionHasApiKey ? $t('settings.assistant.key_saved_placeholder') : 'sk-…'"
                :description="$t('settings.assistant.key_hint')"
              >
                <template #right>
                  <button v-if="draft.transcriptionHasApiKey" type="button" class="mx-btn xs ghost" @click.prevent="clearApiKey('transcription')">{{ $t('settings.assistant.remove_key') }}</button>
                </template>
              </app-field>
              <app-field
                v-model="draft.transcriptionModel"
                name="transcriptionModel"
                :label="$t('settings.assistant.model')"
                :placeholder="$t('settings.assistant.model_default', { model: DEFAULT_TRANSCRIPTION_MODEL })"
              />
              <app-field
                v-model="draft.transcriptionLanguage"
                name="transcriptionLanguage"
                :label="$t('settings.assistant.language')"
                :placeholder="$t('settings.assistant.language_auto')"
                :description="$t('settings.assistant.transcription_language_info')"
              />
            </div>
            <div class="mx-note mt-3">
              <app-icon :icon="IconLock" :size="16" :stroke="2" />
              <span>
                <b class="block" style="color: var(--foreground)">{{ $t('settings.assistant.own_note_title') }}</b>
                {{ $t('settings.assistant.own_note_transcription') }}
              </span>
            </div>
          </template>

          <button v-if="transcriptionSource !== 'none'" type="button" class="mx-btn out mx-btn-block mt-3" :disabled="testing.transcription" @click="testTranscription">
            <span v-if="testing.transcription" class="mx-spin" />
            <app-icon v-else :icon="IconMicrophone" :size="16" :stroke="2" />
            <span>{{ $t('settings.assistant.transcription_test') }}</span>
          </button>
        </app-card>
      </main>

      <app-button-form-save :disabled="isSaving" />
    </app-form>

    <!-- Try it out: a sample run with the settings on this page, nothing is saved -->
    <app-sheet v-model:show="isTryOpen" :title="$t('settings.assistant.try_open')" full>
      <div class="mx-try">
        <p class="mx-d">{{ $t('settings.assistant.try_desc') }}</p>
        <app-text-area v-model="tryIt.text" :label="$t('settings.assistant.try_sample')" :placeholder="$t('settings.assistant.try_placeholder')" :visible-lines="2" :description="tryIt.uses" />

        <div v-if="!tryIt.activeRun" class="mx-note">
          <app-icon :icon="IconFlask" :size="16" :stroke="2" />
          <span>{{ $t('settings.assistant.try_empty') }}</span>
        </div>

        <template v-else>
          <div class="mx-try__runs">
            <button
              v-for="(item, index) in tryIt.runs"
              :key="item.id"
              type="button"
              class="mx-chip"
              :class="{ 'fill on': index === tryIt.activeIndex }"
              :aria-pressed="index === tryIt.activeIndex"
              @click="tryIt.activeIndex = index"
            >
              {{ $t('settings.assistant.try_run_label', { n: item.id, history: item.historyCount || $t('settings.assistant.history_off') }) }}
            </button>
          </div>

          <div class="mx-chips">
            <span class="mx-chip" :class="run.matched === run.total ? 'mx-try__ok' : 'warn'">{{ $t('settings.assistant.try_matched', { matched: run.matched, total: run.total }) }}</span>
            <span v-if="run.durationMs" class="mx-chip"
              ><app-icon :icon="IconClock" :size="12" :stroke="2" /><span>{{ $t('settings.assistant.try_seconds', { seconds: (run.durationMs / 1000).toFixed(2) }) }}</span></span
            >
            <span class="mx-chip">
              <app-icon :icon="IconArrowsExchange" :size="12" :stroke="2" /><span>{{ $t('settings.assistant.try_tokens', { in: run.tokensIn, out: run.tokensOut ?? '—' }) }}</span>
            </span>
            <span class="mx-chip"
              ><span>{{ run.model }}</span></span
            >
          </div>

          <div class="mx-seg" role="group">
            <button v-for="view in tryViews" :key="view" type="button" :class="{ on: tryView === view }" :aria-pressed="tryView === view" @click="tryView = view">
              {{ $t(`settings.assistant.try_tab_${view}`) }}
            </button>
          </div>

          <template v-if="tryView === 'result'">
            <div v-for="(result, index) in run.results" :key="index" class="mx-try__box">
              <div class="mx-try__h">
                <app-icon :icon="IconReceipt" :size="16" :stroke="2" />
                <b>{{ result.description }}</b>
                <span class="amt">{{ result.amount ?? '—' }} {{ result.currency ?? '' }}</span>
              </div>
              <div v-for="field in result.fields" :key="field.key" class="mx-try__f">
                <span class="k">{{ $t(`settings.assistant.try_field_${field.key}`) }}</span>
                <span class="v">{{ field.value }}</span>
                <span class="mx-chip" :class="statusClass(field.status)">{{ $t(`settings.assistant.try_status_${field.status}`) }}</span>
              </div>
            </div>
          </template>

          <template v-else-if="tryView === 'prompt'">
            <div class="mx-try__box">
              <div v-for="section in run.sections" :key="section.key">
                <button type="button" class="mx-try__sh" :aria-expanded="!!openSections[section.key]" @click="openSections[section.key] = !openSections[section.key]">
                  <app-icon :icon="openSections[section.key] ? IconChevronDown : IconChevronRight" :size="14" :stroke="2" />
                  <span class="n">{{ $t(`settings.assistant.try_section_${section.key}`) }}</span>
                  <span class="mx-badge">{{ section.tokens ? $t('settings.assistant.try_section_tokens', { tokens: section.tokens }) : '—' }}</span>
                </button>
                <pre v-if="openSections[section.key]" class="mx-try__pre">{{ section.body || $t('settings.assistant.try_section_empty') }}</pre>
              </div>
            </div>
            <p class="mx-d">{{ $t('settings.assistant.try_prompt_note', { tokens: run.tokensIn }) }}</p>
          </template>

          <pre v-else class="mx-try__pre mx-try__box">{{ run.raw }}</pre>
        </template>
      </div>

      <template #footer>
        <button type="button" class="mx-btn out" @click="isTryOpen = false">{{ $t('close') }}</button>
        <button type="button" class="mx-btn pri" :disabled="tryIt.isRunning || !tryIt.text.trim()" @click="tryIt.run">
          <span v-if="tryIt.isRunning" class="mx-spin" />
          <app-icon v-else :icon="IconPlayerPlay" :size="16" :stroke="2" />
          <span>{{ tryIt.isRunning ? $t('settings.assistant.try_running') : $t('settings.assistant.try_run') }}</span>
        </button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import {
  IconArrowsExchange,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconFlask,
  IconInfoCircle,
  IconLock,
  IconMicrophone,
  IconPlayerPlay,
  IconPlugConnected,
  IconReceipt,
} from '@tabler/icons-vue'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { rule } from '~/core/utils/ValidationUtils.js'
import { DEFAULT_LLM_MODEL, DEFAULT_TRANSCRIPTION_MODEL, useAssistantSettings } from '~/core/composables/useAssistantSettings'
import { useAssistantTryIt } from '~/core/composables/useAssistantTryIt'
import { useAssistantHistoryOptions } from '~/core/composables/useAssistantHistory'

const { t } = useI18n()
const profileStore = useProfileStore()

const assistantTodoTagMatcher = ref('')
const assistantCurrency = ref(null)
const autoFocusAssistant = ref(false)
const assistantLlmContext = ref('')
const assistantHistoryCount = ref(50)

const syncedSettings = [
  { store: profileStore, path: 'autoFocusAssistant', ref: autoFocusAssistant },
  { store: profileStore, path: 'assistantTodoTagMatcher', ref: assistantTodoTagMatcher },
  { store: profileStore, path: 'assistantCurrency', ref: assistantCurrency },
  { store: profileStore, path: 'assistantLlmContext', ref: assistantLlmContext },
  { store: profileStore, path: 'assistantHistoryCount', ref: assistantHistoryCount },
]
watchSettingsStore(syncedSettings)

const { draft, server, isSaving, testing, load, save, clearApiKey, llmOverride, llmSource, transcriptionSource, llmModelInUse, testLlm, testTranscription } = useAssistantSettings()

const badge = (source) =>
  ({
    own: { cls: 'mx-badge pri', text: t('settings.assistant.badge_own') },
    server: { cls: 'mx-pill-ok', text: t('settings.assistant.source_server') },
    none: { cls: 'mx-chip warn', text: t('settings.assistant.llm_not_configured') },
  })[source]

const { historyOptions, historyHelp } = useAssistantHistoryOptions(assistantHistoryCount)

// Saves the profile settings and the assistant connections together
const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const [response, isConnectionSaved] = await Promise.all([profileStore.writeProfile(), save()])
  if (ResponseUtils.isSuccess(response) && isConnectionSaved) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
}

// ----- Try it out -----
const isTryOpen = ref(false)
const tryViews = ['result', 'prompt', 'raw']
const tryView = ref('result')
const openSections = ref({})
const tryIt = reactive(useAssistantTryIt({ llmOverride, llmContext: assistantLlmContext, historyCount: assistantHistoryCount, modelInUse: llmModelInUse, source: llmSource }))
const run = computed(() => tryIt.activeRun)
const statusClass = (status) => ({ matched: 'mx-try__ok', new: 'fill', unmatched: 'warn', none: '' })[status]

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.assistant.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  load()
  animateSettings()
})
</script>
