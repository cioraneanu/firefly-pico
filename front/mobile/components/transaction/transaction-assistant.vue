<template>
  <div class="vant-card flex-col mt-1.25">
    <div class="vant-card-title flex items-center gap-1">
      {{ $t('transaction.assistant') }}
      <app-tutorial :title="$t('transaction.assistant_tutorial_title')" :body="$t('transaction.assistant_tutorial_body')" />

      <div class="flex-1" />
      <currency-dropdown v-model="profileStore.assistantCurrency" class="text-12" :is-clearable="true" />
    </div>
    <div class="text-12 text-muted mb-1.25">{{ $t('transaction.assistant_format') }}</div>

    <div class="flex flex-col">
      <div class="flex items-center gap-2 transaction-assistant-input-row">
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
        <ramble :assistant-text="assistantText" />
      </div>

      <template v-if="previewTags.length > 0 || parsed.isTodo">
        <div class="flex items-center gap-2 p-1.25 mt-2.5 text-12 flex-wrap border border-[#dee2e6] rounded-[3px]">
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
  </div>
</template>

<script setup>
import AppTutorial from '~/mobile/components/ui-kit/app-tutorial.vue'
import Ramble from '~/mobile/components/transaction/ramble.vue'

const profileStore = useProfileStore()
const emit = defineEmits(['change'])
const assistantText = defineModel({ type: String })
const assistantFieldRef = ref(null)

const { parsed, previewTags } = useTransactionAssistant(assistantText, (change) => emit('change', change))

onMounted(async () => {
  if (!profileStore.autoFocusAssistant) return
  await nextTick()
  assistantFieldRef.value?.focus()
})
</script>
