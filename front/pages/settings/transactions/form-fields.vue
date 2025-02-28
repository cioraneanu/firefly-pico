<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset class="">
        <div class="flex-column van-cell p-10">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }" >
              <div class="app-field m-5" @click="onClickIsVisible(element)">
                <div class="van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select" >
                  <app-icon :icon="element.icon" :size="20" />
                  <div class="flex-1">{{ element.name }}</div>
                  <app-icon :icon="getIsVisibleIcon(element)" :size="20"  />
                </div>
              </div>
            </template>
          </app-repeater>
        </div>
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { TRANSACTION_FORM_FIELDS_LIST } from '~/constants/FormConstants'
import * as FormConstants from '~/constants/FormConstants'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.transactionFormFieldsConfig = fieldsList.value
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}


const init = () => {
  let isListOk = profileStore.transactionFormFieldsConfig.length === TRANSACTION_FORM_FIELDS_LIST.length
  fieldsList.value = isListOk ? profileStore.transactionFormFieldsConfig : TRANSACTION_FORM_FIELDS_LIST
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Set form fields',
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
