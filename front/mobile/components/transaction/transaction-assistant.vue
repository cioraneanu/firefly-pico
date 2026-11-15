<template>
  <section class="mx-card">
    <div class="mx-card__h mx-card__h--asst">
      <div>
        <div class="ttl">
          <h2 class="mx-card__t">{{ $t('transaction.assistant') }}</h2>
          <div class="flex items-center gap-1">
            <currency-dropdown v-model="profileStore.assistantCurrency" :is-clearable="true" />
            <button type="button" class="mx-ib sm" :aria-label="$t('transaction.assistant_tutorial_title')" aria-haspopup="dialog" @click="isHelpVisible = true">
              <app-icon :icon="IconHelpCircle" :size="16" :stroke="2" />
            </button>
          </div>
        </div>
        <p class="mx-card__d">{{ $t('transaction.assistant_format') }}</p>
      </div>
    </div>

    <div class="mx-card__c flex flex-col gap-2.5">
      <div class="mx-tools">
        <app-field ref="assistantFieldRef" v-model="assistantText" class="flex-1" :placeholder="`${$t('transaction.assistant')} ...`" :icon="IconSparkles" show-icon clearable @focus="isFocused = true" @blur="isFocused = false" />
        <transaction-amount-field-operations v-if="isFocused" basic @result="onOperation" />
        <ramble :assistant-text="assistantText" />
      </div>

      <div v-if="isFocused" class="mx-aqt">
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="mx-aqt__c"
          :class="{ on: quickState[action.key] === action.value, todo: action.key === 'isTodo' }"
          :aria-pressed="quickState[action.key] === action.value"
          @mousedown.prevent
          @click="toggleQuickAction(action)"
        >
          <app-icon :icon="action.icon" :size="14" :stroke="2" />
          <span>{{ $t(action.label) }}</span>
        </button>
      </div>

      <div v-if="previewTags.length > 0 || parsed.isTodo" class="mx-chips" style="margin-top: 0">
        <span v-for="previewTag in previewTags" :key="previewTag.label" class="mx-chip fill">
          <span class="mx-muted">{{ previewTag.label }}</span>
          <span>{{ previewTag.value }}</span>
        </span>
        <span v-if="parsed.isTodo" class="mx-chip todo">{{ $t('todo') }}</span>
      </div>
    </div>

    <app-sheet v-model:show="isHelpVisible" :title="$t('transaction.assistant_tutorial_title')">
      <div class="mx-prose" v-html="$t('transaction.assistant_tutorial_body')" />
      <template #footer>
        <button type="button" class="mx-btn pri" @click="isHelpVisible = false">{{ $t('ok') }}</button>
      </template>
    </app-sheet>
  </section>
</template>

<script setup>
import { IconCalendar, IconCheckbox, IconHelpCircle, IconSparkles } from '@tabler/icons-vue'
import Ramble from '~/mobile/components/transaction/ramble.vue'

// Assistant card on the new-transaction page (design: MX-TransactionNew top card, help in a sheet as MX-HelpSheet).
const profileStore = useProfileStore()
const emit = defineEmits(['change'])
const assistantText = defineModel({ type: String })
const assistantFieldRef = ref(null)
const isHelpVisible = ref(false)
const isFocused = ref(false)
const onOperation = ({ value }) => (assistantText.value = `${assistantText.value ?? ''}${value}`)

const DAYS_REGEX = /(?:^|\s)([+-]\d+d)(?=\s|$)/i
const quickActions = [
  { key: 'isTodo', value: true, label: 'todo', icon: IconCheckbox },
  { key: 'days', value: '-1d', label: 'yesterday', icon: IconCalendar },
  { key: 'days', value: '-2d', label: 'two_days_ago', icon: IconCalendar },
]

const quickState = computed(() => {
  const matcher = profileStore.assistantTodoTagMatcher
  let rest = (assistantText.value ?? '').trim()
  const isTodo = !!matcher && rest.endsWith(matcher)
  if (isTodo) rest = rest.slice(0, -matcher.length)
  return { rest: rest.replace(DAYS_REGEX, '').trim(), days: rest.match(DAYS_REGEX)?.[1].toLowerCase(), isTodo }
})

const toggleQuickAction = ({ key, value }) => {
  const { rest, days, isTodo } = { ...quickState.value, [key]: quickState.value[key] === value ? null : value }
  assistantText.value = `${[rest, days].filter(Boolean).join(' ')} ${isTodo ? profileStore.assistantTodoTagMatcher : ''}`.trimStart()
}

const { parsed, previewTags } = useTransactionAssistant(assistantText, (change) => emit('change', change))

onMounted(async () => {
  if (!profileStore.autoFocusAssistant) return
  await nextTick()
  assistantFieldRef.value?.focus()
})
</script>
