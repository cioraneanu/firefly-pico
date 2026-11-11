<template>
  <Teleport to="#d-portal">
    <TransitionGroup name="d-toast" tag="div" class="fixed bottom-6 right-6 z-[80] flex w-89 flex-col gap-2">
      <div v-for="toast in toasts" :key="toast.id" role="status" class="flex items-center gap-2 rounded-lg border border-line bg-pop p-4 text-[13px] leading-[1.4] shadow-[0_4px_12px_rgb(0_0_0/0.1)]">
        <icon-circle-check v-if="toast.type === 'success'" :size="16" class="text-success" />
        <icon-alert-circle v-else-if="toast.type === 'danger'" :size="16" class="text-danger" />
        <icon-info-circle v-else :size="16" class="text-info" />
        <span class="font-medium">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-vue'

const { toasts } = useDesktopUI()
</script>
