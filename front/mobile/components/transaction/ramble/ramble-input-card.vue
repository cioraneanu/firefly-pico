<template>
  <van-cell-group inset class="ramble-composer m-0 overflow-hidden">
    <div class="p-4 flex flex-col gap-2">
      <div class="flex items-center flex-wrap gap-2">
        <van-badge :content="savedRamblesCount" :show-zero="false" max="99" class="ramble-modern-badge">
          <van-button round size="small" plain class="cursor-pointer" :loading="isLoadingSaved" :disabled="isDisabled" @click="emit('loadSaved')">
            <app-icon :icon="TablerIconConstants.list" :size="16" />
            {{ $t('transaction.assistant_ramble_load_saved') }}
          </van-button>
        </van-badge>

        <van-button
          v-if="savedRambles.length > 0"
          round
          size="small"
          type="danger"
          plain
          class="cursor-pointer"
          :loading="isDeletingSaved"
          :disabled="isDisabled"
          :title="$t('transaction.assistant_ramble_delete_saved')"
          @click="emit('deleteSaved')"
        >
          <van-icon name="delete-o" size="16" />
          {{ $t('delete') }}
        </van-button>

        <div class="flex-1" />


      </div>

      <div v-if="savedRambles.length > 0" class="ramble-saved-list flex flex-col gap-2">
        <div v-for="savedRamble in savedRambles" :key="savedRamble.id" class="ramble-saved-item flex gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-13 wrap-anywhere">{{ savedRamble.text }}</div>
            <div class="text-11 text-muted mt-1">{{ formatCreatedAt(savedRamble.created_at) }}</div>
          </div>
          <van-button
            v-if="savedRamble.has_voice"
            round
            size="small"
            plain
            class="cursor-pointer ramble-icon-button"
            :disabled="isDisabled"
            :loading="loadingVoiceRambleId === savedRamble.id"
            :title="playingVoiceRambleId === savedRamble.id ? $t('transaction.assistant_ramble_stop_playback') : $t('transaction.assistant_ramble_play')"
            @click="toggleSavedRambleVoice(savedRamble)"
          >
            <app-icon :icon="playingVoiceRambleId === savedRamble.id ? TablerIconConstants.stop : TablerIconConstants.play" :size="15" />
          </van-button>
          <van-button round size="small" plain type="danger" class="cursor-pointer ramble-icon-button" :disabled="isDisabled" :title="$t('delete')" @click="emit('deleteRamble', savedRamble)">
            <van-icon name="delete-o" size="15" />
          </van-button>
        </div>
      </div>

      <app-text-area
        v-model="rambleText"
        class="van-cell-no-padding compact ramble-composer-input"
        label=""
        :visible-lines="2"
        :placeholder="$t('transaction.assistant_ramble_placeholder')"
        :clearable="true"
        :disabled="isDisabled"
      />

      <div v-if="isRecording" class="flex items-center gap-2 text-12">
        <span class="ramble-live-dot" />
        <span class="wrap-anywhere flex-1 min-w-0 text-muted">{{ speechTemporary || $t('transaction.assistant_ramble_listening') }}</span>
      </div>

      <van-button block round class="cursor-pointer mt-1 ramble-interpret-button" :loading="isInterpreting" :disabled="isDisabled || !canInterpret" @click="onInterpret">
        <app-icon :icon="TablerIconConstants.magic" :size="16" />
        {{ $t('transaction.assistant_ramble_interpret') }}
      </van-button>
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import DateUtils from '~/core/utils/DateUtils.js'

const props = defineProps({
  savedRambles: {
    type: Array,
    default: () => [],
  },
  savedRamblesCount: {
    type: Number,
    default: 0,
  },
  isLoadingSaved: {
    type: Boolean,
    default: false,
  },
  isDeletingSaved: {
    type: Boolean,
    default: false,
  },
  isInterpreting: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['interpret', 'loadSaved', 'deleteSaved', 'deleteRamble'])
const rambleText = defineModel({ type: String, default: '' })

const { speechTemporary, isRecording, stopRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice } = useRambleDictation(rambleText)

const canInterpret = computed(() => !!rambleText.value.trim() || props.savedRambles.length > 0)
const formatCreatedAt = (createdAt) => (createdAt ? DateUtils.dateToUIWithTime(new Date(createdAt)) : '')

const onInterpret = () => {
  if (props.isDisabled) return
  stopRecording()
  emit('interpret')
}

defineExpose({ stopRecording })
</script>
