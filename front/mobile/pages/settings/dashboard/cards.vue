<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <settings-order-list v-model="fieldsList" :hint="$t('settings.reorder_hint_cards')" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { dashboardCard, dashboardCardList } from '~/core/constants/DashboardConstants.js'
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

const init = () => {
  const isListOk = profileStore.dashboardWidgetsConfig.length === dashboardCardList.length
  const sourceList = isListOk ? profileStore.dashboardWidgetsConfig : dashboardCardList
  fieldsList.value = sourceList.filter((card) => isCardEnabled(card.code))
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
