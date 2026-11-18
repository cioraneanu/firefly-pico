<template>
  <section class="mx-card">
    <div class="mx-card__h mx-card__h--asst">
      <div>
        <div class="ttl">
          <h2 class="mx-card__t">{{ $t('transaction.assistant') }}</h2>
          <div class="flex items-center gap-1">
            <currency-dropdown v-model="profileStore.assistantCurrency" :is-clearable="true" />
            <button type="button" class="mx-ib sm out" :aria-label="$t('transaction.assistant_tutorial_title')" aria-haspopup="dialog" @click="isHelpVisible = true">
              <app-icon :icon="IconHelpCircle" :size="16" :stroke="2" />
            </button>
          </div>
        </div>
        <p class="mx-card__d">{{ $t('transaction.assistant_format') }}</p>
      </div>
    </div>

    <div class="mx-card__c flex flex-col gap-2.5">
      <div class="mx-tools">
        <app-field
          ref="assistantFieldRef"
          v-model="assistantText"
          class="flex-1"
          :placeholder="`${$t('transaction.assistant')} ...`"
          :icon="IconSparkles"
          show-icon
          clearable
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
        <transaction-amount-field-operations v-if="isFocused" basic @result="onOperation" />
        <ramble :assistant-text="assistantText" />
      </div>

      <div v-if="isFocused" class="mx-aqt">
        <span class="mx-aip-lead" aria-hidden="true"><app-icon :icon="IconBolt" :size="15" :stroke="2" /></span>
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="mx-aqt__c"
          :class="{ on: action.isOn, todo: action.key === 'isTodo' }"
          :aria-pressed="action.isOn"
          @mousedown.prevent
          @click="toggleQuickAction(action)"
        >
          <app-icon :icon="quickActionIcons[action.label]" :size="14" :stroke="2" />
          <span>{{ $t(action.label) }}</span>
        </button>
      </div>

      <div v-if="previewTags.length > 0" class="mx-aip" :class="{ sep: isFocused }" aria-live="polite">
        <span class="mx-aip-lead" aria-hidden="true"><app-icon :icon="IconWand" :size="15" :stroke="2" /></span>
        <span v-for="previewTag in previewTags" :key="previewTag.key" class="mx-aip__k" :title="previewTag.label">
          <app-icon :icon="previewTagIcons[previewTag.key]" :size="12" :stroke="2" />
          <span>{{ previewTag.value }}</span>
          <button type="button" :aria-label="`${$t('clear')} ${previewTag.label}`" @mousedown.prevent @click="removePreviewTag(previewTag.key)">
            <app-icon :icon="IconX" :size="11" :stroke="2" />
          </button>
        </span>
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
import { IconBolt, IconCalendar, IconCategory, IconCheckbox, IconCoins, IconHelpCircle, IconNotes, IconSparkles, IconTag, IconTemplate, IconWand, IconX } from '@tabler/icons-vue'
import Ramble from '~/mobile/components/transaction/ramble.vue'

// Assistant card on the new-transaction page (design: MX-TransactionNew top card, help in a sheet as MX-HelpSheet).
const profileStore = useProfileStore()
const emit = defineEmits(['change'])
const assistantText = defineModel({ type: String })
const assistantFieldRef = ref(null)
const isHelpVisible = ref(false)
const isFocused = ref(false)
const onOperation = ({ value }) => (assistantText.value = `${assistantText.value ?? ''}${value}`)

// Design MX-TransactionNew, result style 4 "Outline + icons": a bolt leads the quick actions, a wand what the assistant understood
const quickActionIcons = { todo: IconCheckbox, yesterday: IconCalendar, two_days_ago: IconCalendar }
const previewTagIcons = { template: IconTemplate, tag: IconTag, category: IconCategory, amount: IconCoins, description: IconNotes, date: IconCalendar, todo: IconCheckbox }

const { previewTags, removePreviewTag, quickActions, toggleQuickAction } = useTransactionAssistant(assistantText, (change) => emit('change', change))

onMounted(async () => {
  if (!profileStore.autoFocusAssistant) return
  await nextTick()
  assistantFieldRef.value?.focus()
})
</script>
