<template>

  <div class="app-form">
    <app-top-toolbar/>

    <van-cell-group inset>
<!--      <div class="van-cell-group-title">Quick transaction amount modifiers:</div>-->

      <div class="van-cell-fake flex-column van-cell">
        <!--          <span>Quick transaction amount modifiers:</span>-->
        <app-repeater
            v-model="quickAmountValues"
            :empty-item="{value: ''}">
          <template #content="{ element, index }">
            <app-field
                placeholder="Value"
                v-model="element.value"
                inputmode="decimal"
            />
          </template>
        </app-repeater>
      </div>

    </van-cell-group>

    <div style="margin: 16px;">
      <van-button round type="primary" @click="onSave" class="app-button-save">
        Save
      </van-button>
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

const appStore = useAppStore()
const dataStore = useDataStore()

const quickAmountValues = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.quickValueButtons = quickAmountValues.value.map(item => {
    let value = sanitizeAmount(item.value)
    let startsWithOperator = ['-', '+'].includes(value[0])
    return startsWithOperator ? value : `+${value}`
  })

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  quickAmountValues.value = appStore.quickValueButtons.map(item => {
    return { value: item }
  })
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Quick transaction amounts',
  backRoute: RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS,
})

</script>