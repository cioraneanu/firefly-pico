<template>
  <app-popup v-model:show="show" :popup-style="popupStyle">
    <div ref="popupRef" class="display-flex flex-direction-column h-100 m-h-0">
      <div class="flex-center-vertical gap-2 px-3 py-2 ramble-divider-bottom">
        <div class="font-600 text-size-16 flex-1">{{ $t('transaction.assistant_ramble_edit_title') }}</div>
        <van-button size="small" class="cursor-pointer" @click="show = false">
          <app-icon :icon="TablerIconConstants.close" :size="18" />
        </van-button>
      </div>

      <div ref="popupContentRef" class="flex-1 m-h-0 overflow-auto">
        <transaction-form v-if="transaction" ref="formRef" v-model="transaction.item" form-name="ramble-transaction-form" />
      </div>

      <div class="display-flex gap-2 p-3 ramble-divider">
        <van-button block class="cursor-pointer" @click="show = false">{{ $t('cancel') }}</van-button>
        <van-button block type="primary" class="cursor-pointer" @click="onSave">{{ $t('save') }}</van-button>
      </div>
    </div>
  </app-popup>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import TransactionForm from '~/components/transaction/TransactionForm.vue'
import UIUtils from '~/utils/UIUtils.js'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'

const emit = defineEmits(['save'])
const show = defineModel('show', { type: Boolean, default: false })
const transaction = defineModel({ type: Object, default: null })

const appStore = useAppStore()
const formRef = ref(null)
const popupRef = ref(null)
const popupContentRef = ref(null)

useSwipeToDismiss({
  onSwipe: () => (show.value = false),
  swipeRef: popupRef,
  scrollRef: popupContentRef,
  showDropdown: show,
})

const popupStyle = computed(() => {
  if (appStore.isDesktopLayout) {
    return { width: '94vw', maxHeight: '92vh' }
  }

  return { height: '96%' }
})

const onSave = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    UIUtils.showToastError('Form has invalid values. Check the red fields :)')
    return
  }

  emit('save', transaction.value)
  show.value = false
}
</script>
