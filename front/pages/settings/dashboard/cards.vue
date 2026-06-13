<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset class="p-10">
        <div class="van-cell-fake flex-column">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-5 cursor-pointer" @click="onClickIsVisible(element)">
                <div class="van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select">
                  <app-icon :icon="element.icon" :size="20" :class="{ 'card-row-muted': !element.isVisible }" />
                  <div class="flex-1 text-size-14" :class="{ 'card-row-muted': !element.isVisible }">{{ element.t ? $t(element.t) : element.name }}</div>
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
import { dashboardCardList } from '~/constants/DashboardConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()

const fieldsList = ref([])
// Cards whose resource is disabled are hidden from the list but kept so the
// saved config keeps the full set of cards.
const hiddenCards = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.dashboardWidgetsConfig = [...fieldsList.value, ...hiddenCards.value]
  const response = await profileStore.writeProfile()
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  const isListOk = profileStore.dashboardWidgetsConfig.length === dashboardCardList.length
  const fullList = isListOk ? profileStore.dashboardWidgetsConfig : dashboardCardList
  hiddenCards.value = fullList.filter((card) => profileStore.isDashboardCardResourceDisabled(card.code))
  fieldsList.value = fullList.filter((card) => !profileStore.isDashboardCardResourceDisabled(card.code))
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

<style scoped>
.card-row-muted {
  opacity: 0.35;
}
</style>
