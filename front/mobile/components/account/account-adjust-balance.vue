<template>
  <div class="van-cell-fake">
    <app-popup v-model:show="showDropdown" :style="style">
      <div ref="popupRef" class="h-full flex flex-col">
        <div class="van-popup-title">Adjust balance</div>

        <div class="text-muted text-12 px-4 mt-2.5 text-center">This will change the account opening balance</div>

        <div ref="popupContentRef" class="flex flex-col flex-1 overflow-auto mt-5">
          <app-field v-model="newAmount" label="New amount" :icon="TablerIconConstants.fieldText2" />
          <div class="flex-1" />
          <van-button round type="primary" native-type="submit" class="mx-4 mb-5 shadow-depth2" @click="onSave">Save </van-button>
        </div>
      </div>
    </app-popup>
  </div>
</template>

<script setup>
import { useSwipeToDismiss } from '~/mobile/composables/useSwipeToDismiss'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import AccountRepository from '~/core/repository/AccountRepository.js'
import Account from '~/core/models/Account.js'

const showDropdown = defineModel('showDropdown', false)
const popupRef = ref(null)
const popupContentRef = ref(null)

const newAmount = ref('0')

const props = defineProps({
  value: {},
})

const style = {
  height: '250px',
  paddingTop: '4px',
}

const emits = defineEmits('result')

watch(showDropdown, (newValue) => {
  newAmount.value = Account.getBalance(props.value)
})

const onSave = async () => {
  const response = await new AccountRepository().adjustBalance(props.value, newAmount.value)
  emits('result', 'onPostSave', response)
  showDropdown.value = false
}

const onHideDropdown = () => {
  showDropdown.value = false
}

useSwipeToDismiss({
  onSwipe: onHideDropdown,
  swipeRef: popupContentRef,
  showDropdown: showDropdown,
})
</script>
