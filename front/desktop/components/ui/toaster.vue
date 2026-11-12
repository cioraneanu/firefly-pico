<template>
  <Teleport to="#d-portal">
    <TransitionGroup name="d-toast" tag="div" class="fixed bottom-6 right-6 z-[80] flex w-89 flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="status"
        :class="[
          'relative flex items-center gap-2 overflow-hidden rounded-lg border border-line bg-pop text-[13px] leading-[1.4] shadow-[0_4px_12px_rgb(0_0_0/0.1)]',
          toast.action ? 'py-2.5 pl-4 pr-2.5' : 'p-4',
        ]"
      >
        <icon-circle-check v-if="toast.type === 'success'" :size="16" class="text-success" />
        <icon-alert-circle v-else-if="toast.type === 'danger'" :size="16" class="text-danger" />
        <icon-info-circle v-else :size="16" class="text-info" />
        <span class="flex-1 font-medium">{{ toast.message }}</span>
        <template v-if="toast.action">
          <d-button size="sm" :icon="IconArrowBackUp" @click="toast.onAction">{{ toast.action.label }}</d-button>
          <span class="d-toast-bar absolute bottom-0 left-0 h-0.5 w-full bg-fg/25" :style="{ animationDuration: `${toast.duration}ms` }" />
        </template>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { IconAlertCircle, IconArrowBackUp, IconCircleCheck, IconInfoCircle } from '@tabler/icons-vue'

const { toasts } = useDesktopUI()
</script>
