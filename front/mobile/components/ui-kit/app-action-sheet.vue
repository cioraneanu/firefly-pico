<template>
  <app-sheet v-model:show="show" :title="title ?? $t('kit.select_option')">
    <button v-for="(action, index) in actions" :key="index" type="button" class="mx-opt" :class="{ dng: action.danger }" :disabled="action.disabled" @click="onAction(action, index)">
      <span v-if="action.icon" class="ic"><app-icon :icon="action.icon" :size="16" :stroke="2" /></span>
      <span class="lb">{{ action.name }}</span>
      <span v-if="action.subname" class="mt">{{ action.subname }}</span>
    </button>
  </app-sheet>
</template>

<script setup>
// Action sheet: a titled sheet of options ({ name, subname?, icon?, danger?, disabled?, callback? }).
// Picking one closes the sheet, runs its callback and emits `select`.
const show = defineModel('show', { type: Boolean, default: false })

defineProps({
  actions: { type: Array, default: () => [] },
  title: { type: String, default: null },
})

const emit = defineEmits(['select'])

const onAction = (action, index) => {
  show.value = false
  action.callback?.(action, index)
  emit('select', action, index)
}
</script>
