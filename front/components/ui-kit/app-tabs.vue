<template>
  <div class="app-tabs" role="tablist" :aria-label="ariaLabel" :style="tabsStyle">
    <div class="app-tabs__indicator" />

    <button
      v-for="option in options"
      :key="option.value"
      class="app-tabs__tab"
      :class="{ 'app-tabs__tab--selected': option.value === modelValue }"
      :disabled="option.disabled"
      type="button"
      role="tab"
      :aria-selected="option.value === modelValue"
      :tabindex="option.value === modelValue ? 0 : -1"
      @click="selectValue(option)"
      @keydown="onKeydown"
    >
      <app-icon v-if="option.icon" class="app-tabs__icon" :icon="option.icon" :size="18" :stroke="1.8" />
      <span class="app-tabs__label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  options: {
    type: Array,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const enabledOptions = computed(() => props.options.filter((option) => !option.disabled))
const selectedIndex = computed(() =>
  Math.max(
    props.options.findIndex((option) => option.value === props.modelValue),
    0,
  ),
)
const tabsStyle = computed(() => ({
  '--app-tabs-count': props.options.length,
  '--app-tabs-selected-index': selectedIndex.value,
}))

const selectValue = (option) => {
  if (option.disabled) {
    return
  }

  emit('update:modelValue', option.value)
}

const selectByIndex = (index) => {
  const option = enabledOptions.value[index]

  if (option) {
    selectValue(option)
  }
}

const selectedEnabledIndex = computed(() => {
  const index = enabledOptions.value.findIndex((option) => option.value === props.modelValue)
  return Math.max(index, 0)
})

const onKeydown = (event) => {
  const keyActions = {
    ArrowRight: () => selectByIndex((selectedEnabledIndex.value + 1) % enabledOptions.value.length),
    ArrowLeft: () => selectByIndex((selectedEnabledIndex.value - 1 + enabledOptions.value.length) % enabledOptions.value.length),
    Home: () => selectByIndex(0),
    End: () => selectByIndex(enabledOptions.value.length - 1),
  }

  if (!keyActions[event.key]) {
    return
  }

  event.preventDefault()
  keyActions[event.key]()
}
</script>

<style scoped>
.app-tabs {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 44px;
  padding: 4px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid var(--van-border-color);
  border-radius: 8px;
  background: var(--van-background-2-5);
}

.app-tabs__indicator {
  position: absolute;
  inset-block: 4px;
  inset-inline-start: 4px;
  z-index: 0;
  width: calc((100% - 8px) / var(--app-tabs-count));
  border-radius: 6px;
  background: var(--van-cell-background);
  box-shadow:
    rgba(0, 0, 0, 0.08) 0 1px 3px,
    rgba(0, 0, 0, 0.12) 0 0 0 1px;
  transform: translateX(calc(var(--app-tabs-selected-index) * 100%));
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.app-tabs__tab {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 6px;
  color: var(--van-text-color-2);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.18s ease,
    opacity 0.18s ease;
}

.app-tabs__tab + .app-tabs__tab:before {
  position: absolute;
  inset-block: 8px;
  inset-inline-start: 0;
  width: 1px;
  content: '';
  background: var(--van-border-color);
  opacity: 0.8;
}

.app-tabs__tab--selected {
  color: var(--van-text-color);
}

.app-tabs__tab--selected:before,
.app-tabs__tab--selected + .app-tabs__tab:before {
  opacity: 0;
}

.app-tabs__tab:focus-visible {
  outline: 2px solid var(--primary-action);
  outline-offset: -3px;
}

.app-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.app-tabs__icon {
  flex: 0 0 auto;
}

.app-tabs__label {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
