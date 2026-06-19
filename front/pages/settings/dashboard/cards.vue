<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset class="p-10">
        <div class="van-cell-fake flex-column">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element }">
              <div class="app-field m-5 cursor-pointer" @click="onClickIsVisible(element)">
                <div :class="getElementClass(element)">
                  <app-icon :icon="element.icon" :size="20" />
                  <div class="flex-1 text-size-14">{{ element.t ? $t(element.t) : element.name }}</div>
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
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { dashboardCard, dashboardCardList } from '~/constants/DashboardConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const isCardEnabled = (cardCode) => {
  if (cardCode === dashboardCard.budgets.code && !profileStore.budgetsEnabled) return false
  if ([dashboardCard.expensesByTag.code, dashboardCard.transfersByTag.code, dashboardCard.todoTransactions.code].includes(cardCode) && !profileStore.tagsEnabled) return false
  if ([dashboardCard.expensesByCategory.code, dashboardCard.transfersByCategory.code].includes(cardCode) && !profileStore.categoriesEnabled) return false
  if (cardCode === dashboardCard.piggyBanks.code && !profileStore.piggyBanksEnabled) return false
  if (cardCode === dashboardCard.recurringTransactions.code && !profileStore.recurringTransactionsEnabled) return false
  return true
}

const onSave = async () => {
  const isListOk = profileStore.dashboardWidgetsConfig.length === dashboardCardList.length
  const fullConfig = isListOk ? profileStore.dashboardWidgetsConfig : dashboardCardList

  const disabledWidgets = fullConfig.filter((card) => !isCardEnabled(card.code))
  profileStore.dashboardWidgetsConfig = [...fieldsList.value, ...disabledWidgets]

  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const getElementClass = (element) => {
  return {
    'van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select': true,
    'text-muted': !element.isVisible,
  }
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  const isListOk = profileStore.dashboardWidgetsConfig.length === dashboardCardList.length
  const sourceList = isListOk ? profileStore.dashboardWidgetsConfig : dashboardCardList
  fieldsList.value = sourceList.filter((card) => isCardEnabled(card.code))
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.dashboard.cards_order'),
  backRoute: RouteConstants.ROUTE_DASHBOARD,
  backRouteDesktop: RouteConstants.ROUTE_DASHBOARD,
})

onMounted(() => {
  animateSettings()
})
</script>
