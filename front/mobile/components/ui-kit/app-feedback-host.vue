<template>
  <Teleport to="#mx-portal" defer>
    <transition-group name="mx-fd">
      <div v-for="toast in toasts" :key="toast.id" class="mx-toast" :class="toastClass(toast)" role="status" @click="toast.close">
        <span class="ok"><app-icon :icon="toastIcon(toast)" :size="13" :stroke="3" /></span>
        <span class="flex-1 min-w-0">{{ toast.message }}</span>
      </div>
    </transition-group>

    <transition name="mx-fd">
      <div v-if="confirmState">
        <button type="button" class="mx-ov" :aria-label="$t('cancel')" @click="answerConfirm(false)" />
        <div class="mx-alert" role="alertdialog" aria-modal="true" aria-labelledby="mx-alert-t">
          <h2 id="mx-alert-t">{{ confirmState.title }}</h2>
          <p>{{ confirmState.message }}</p>
          <div class="row">
            <button type="button" class="mx-btn out" @click="answerConfirm(false)">{{ $t('cancel') }}</button>
            <button type="button" class="mx-btn" :class="confirmState.danger ? 'dng-solid' : 'pri'" @click="answerConfirm(true)">{{ confirmState.confirmText ?? $t('delete') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { IconCheck, IconExclamationMark, IconX } from '@tabler/icons-vue'
import { useMobileFeedback } from '~/mobile/composables/useMobileFeedback'

const { toasts, confirmState, answerConfirm } = useMobileFeedback()

const toastClass = (toast) => ({ err: toast.type === 'danger', warn: toast.type === 'warning' })
const toastIcon = (toast) => ({ danger: IconX, warning: IconExclamationMark })[toast.type] ?? IconCheck
</script>
