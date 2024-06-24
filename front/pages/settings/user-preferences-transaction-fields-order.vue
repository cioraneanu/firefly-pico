<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset class="p-10">
      <!--      <div class="van-cell-group-title">Quick transaction amount modifiers:</div>-->

      <div class="van-cell-fake flex-column van-cell">
        <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
          <template #content="{ element, index }">
            <div class="app-field m-5 pointer-events-none prevent-select">
              <div class="van-field__body">{{ element.name }}</div>
            </div>
          </template>
        </app-repeater>
      </div>
    </van-cell-group>

    <div style="margin: 16px">
      <van-button round type="primary" native-type="submit" @click="onSave" class="app-button-save"> Save </van-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { FORM_CONSTANTS_TRANSACTION_FIELDS_LIST } from '~/constants/FormConstants'
import * as FormConstants from '~/constants/FormConstants'

const appStore = useAppStore()
const dataStore = useDataStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.transactionOrderedFieldsList = fieldsList.value
  
  await appStore.writeAppSettings()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  let isListOk = appStore.transactionOrderedFieldsList.length === FORM_CONSTANTS_TRANSACTION_FIELDS_LIST.length
  fieldsList.value = isListOk ? appStore.transactionOrderedFieldsList : FORM_CONSTANTS_TRANSACTION_FIELDS_LIST
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Transaction fields order',
  backRoute: RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS,
})

onMounted(() => {
  animateSettings()
})

</script>
