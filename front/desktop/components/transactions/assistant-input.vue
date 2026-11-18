<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center gap-2">
      <d-input v-model="text" :icon="IconSparkles" :placeholder="`${$t('transaction.assistant')}…`" :autofocus="profileStore.autoFocusAssistant" clearable class="flex-1" @keydown.enter="onEnter" />
      <div class="w-32">
        <d-currency-select v-model="profileStore.assistantCurrency" clearable />
      </div>
      <d-button size="icon" :icon="IconHelpCircle" :aria-label="$t('transaction.assistant_tutorial_title')" aria-haspopup="dialog" @click="isHelpOpen = true" />
    </div>

    <d-dialog :open="isHelpOpen" :title="$t('transaction.assistant_tutorial_title')" size="lg" @close="isHelpOpen = false">
      <div class="flex flex-col gap-2 text-sm [&_code]:rounded [&_code]:bg-soft [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px]" v-html="$t('transaction.assistant_tutorial_body')" />
    </d-dialog>

    <!-- Mobile design result style 4 "Outline + icons", side by side: what was understood on the left, quick actions always on the right -->
    <div class="flex items-start gap-3">
      <div class="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-1.5" aria-live="polite">
        <icon-wand :size="15" class="shrink-0 text-dim" aria-hidden="true" />
        <template v-if="previewTags.length">
          <span v-for="tag in previewTags" :key="tag.key" class="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-fg pr-0.5 pl-2 text-[13px] font-medium" :title="tag.label">
            <app-icon :icon="previewTagIcons[tag.key]" :size="12" :stroke="2" class="shrink-0" />
            <span class="truncate">{{ tag.value }}</span>
            <button
              type="button"
              class="grid size-5 shrink-0 cursor-pointer place-items-center rounded-[5px] opacity-70 hover:bg-soft hover:opacity-100"
              :aria-label="`${$t('clear')} ${tag.label}`"
              @click="removePreviewTag(tag.key)"
            >
              <icon-x :size="11" />
            </button>
          </span>
        </template>
        <span v-else class="text-[13px] text-dim">{{ $t('transaction.assistant_format') }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 border-l border-line pl-3">
        <icon-bolt :size="15" class="text-dim" aria-hidden="true" />
        <d-button
          v-for="action in quickActions"
          :key="action.label"
          size="sm"
          :variant="action.isOn ? 'primary' : 'secondary'"
          :icon="quickActionIcons[action.label]"
          :aria-pressed="action.isOn"
          @click="toggleQuickAction(action)"
        >
          {{ $t(action.label) }}
        </d-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconBolt, IconCalendar, IconCategory, IconCheckbox, IconCoins, IconHelpCircle, IconNotes, IconSparkles, IconTag, IconTemplate, IconWand, IconX } from '@tabler/icons-vue'

const text = defineModel()
const emit = defineEmits(['change', 'submit'])

const profileStore = useProfileStore()
const isHelpOpen = ref(false)
const { previewTags, removePreviewTag, quickActions, toggleQuickAction, flush } = useTransactionAssistant(text, (change) => emit('change', change))

const quickActionIcons = { todo: IconCheckbox, yesterday: IconCalendar, two_days_ago: IconCalendar }
const previewTagIcons = { template: IconTemplate, tag: IconTag, category: IconCategory, amount: IconCoins, description: IconNotes, date: IconCalendar, todo: IconCheckbox }

// Enter: apply what was typed now, then ask to save (not while an IME composition is open)
const onEnter = async (event) => {
  if (event.isComposing) return
  event.preventDefault()
  if (!text.value) return
  flush()
  await nextTick()
  emit('submit')
}
</script>
