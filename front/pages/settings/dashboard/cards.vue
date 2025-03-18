<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset class="p-10">
        <div class="van-cell-fake flex-column">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-5" @click="onClickIsVisible(element)">
                <div class="van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select">
                  <app-icon :icon="element.icon" :size="20" />
                  <div class="flex-1">{{ element.t ? $t(element.t) : element.name }}</div>
                  <app-icon :icon="getIsVisibleIcon(element)" :size="20" />
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
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { dashboardCardList } from '~/constants/DashboardConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.dashboardWidgetsConfig = fieldsList.value
  await profileStore.writeProfile()
  UIUtils.showToastSuccess(t('settings.settings_saved'))
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  let isListOk = profileStore.dashboardWidgetsConfig.length === dashboardCardList.length
  fieldsList.value = isListOk ? profileStore.dashboardWidgetsConfig : dashboardCardList
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.dashboard.cards_order'),
  backRoute: RouteConstants.ROUTE_DASHBOARD,
})

onMounted(() => {
  animateSettings()
})
</script>
