<template>
  <div class="van-cell-fake">
    <van-popup v-model:show="showDropdown" round position="bottom" style="height: 250px; padding-top: 4px">
      <div ref="popupRef" class="h-100 display-flex flex-column">
        <div class="van-popup-title">Adjust balance</div>

        <div ref="popupContentRef" class="display-flex flex-column flex-1 overflow-auto mt-20">
          <app-field label="New amount" :icon="TablerIconConstants.fieldText2" v-model="newAmount" />
          <div class="flex-1" />
          <van-button @click="onSave" round type="primary" native-type="submit" class="mx-3 mb-20 shadow-depth2">Save </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { cloneDeep, get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { isEqual } from 'lodash/lang'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AccountRepository from '~/repository/AccountRepository.js'
import AccountTransformer from '~/transformers/AccountTransformer.js'

const dataStore = useDataStore()

const showDropdown = defineModel('showDropdown', false)
const popupRef = ref(null)
const popupContentRef = ref(null)

const newAmount = ref('0')

const props = defineProps({
  value: {},
})

watch(showDropdown, (newValue) => {
  newAmount.value = get(props.value, 'attributes.current_balance')
})

const onSave = async () => {
  let accountId = get(props.value, 'id')
  let accountBody = cloneDeep(props.value)
  let correction = parseFloat(newAmount.value) - parseFloat(get(props.value, 'attributes.current_balance'))
  accountBody.attributes.opening_balance = parseFloat(accountBody.attributes.opening_balance) + correction
  accountBody = AccountTransformer.transformToApi(accountBody)
  let response = await new AccountRepository().update(accountId, accountBody)

  let newItem = get(response, 'data.data')
  newItem = AccountTransformer.transformFromApi(newItem)
  dataStore.accountList = [newItem, ...dataStore.accountList.filter((item) => item.id !== accountId)]

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

<style></style>
