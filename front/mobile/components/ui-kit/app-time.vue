<template>
  <div class="mx-f">
    <div class="mx-l">{{ label ?? $t('kit.choose_time') }}</div>
    <div class="mx-sel" role="button" tabindex="0" aria-haspopup="dialog" :aria-label="label ?? $t('kit.choose_time')" @click="showDropdown = true" @keydown.enter.prevent="showDropdown = true">
      <span class="val">
        <app-icon :icon="IconClock" :size="16" :stroke="2" />
        <span v-if="time" class="tx mx-tnum">{{ time }}</span>
        <span v-else class="ph">{{ $t('kit.no_time') }}</span>
      </span>
      <button v-if="time" type="button" class="x" :aria-label="$t('clear')" @click.stop="modelValue = null">
        <app-icon :icon="IconX" :size="14" :stroke="2" />
      </button>
    </div>

    <app-date-time-grid-time-popup v-model:show="showDropdown" v-model="time" :title="label" />
  </div>
</template>

<script setup>
import { IconClock, IconX } from '@tabler/icons-vue'

// Time field; the value is [hours, minutes] as before (the old Vant time picker shape).
const modelValue = defineModel()

defineProps({
  label: { type: String, default: null },
})

const showDropdown = ref(false)

const time = computed({
  get: () => (modelValue.value?.length ? modelValue.value.map((part) => String(part).padStart(2, '0')).join(':') : null),
  set: (value) => (modelValue.value = value ? value.split(':') : null),
})
</script>
