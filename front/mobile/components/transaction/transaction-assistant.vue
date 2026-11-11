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
        <app-field ref="assistantFieldRef" v-model="assistantText" class="flex-1" :placeholder="`${$t('transaction.assistant')} ...`" :icon="IconSparkles" show-icon clearable />
        <ramble :assistant-text="assistantText" />
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
import { IconHelpCircle, IconSparkles } from '@tabler/icons-vue'
import Ramble from '~/mobile/components/transaction/ramble.vue'

// Assistant card on the new-transaction page (design: MX-TransactionNew top card, help in a sheet as MX-HelpSheet).
const profileStore = useProfileStore()
const emit = defineEmits(['change'])
const assistantText = defineModel({ type: String })
const assistantFieldRef = ref(null)
const isHelpVisible = ref(false)

const { parsed, previewTags } = useTransactionAssistant(assistantText, (change) => emit('change', change))

onMounted(async () => {
  if (!profileStore.autoFocusAssistant) return
  await nextTick()
  assistantFieldRef.value?.focus()
})
</script>
