<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <app-field-link :icon="TablerIconConstants.order" :label="$t('settings.dashboard.cards_order')" @click="onGoToDashboardCardsOrder" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.dashboard.config') }}:</div>
        <app-boolean :label="$t('settings.dashboard.show_empty_accounts')" v-model="areEmptyAccountsVisible" />
        <app-boolean :label="$t('settings.dashboard.show_decimal_places')" v-model="showDecimal" />

        <app-select
            :label="$t('settings.formatting.first_day_of_month')"
            :popupTitle="$t('settings.formatting.select_first_day_of_month')"
            v-model="firstDayOfMonth"
            v-model:showDropdown="isDropdownFirstDayVisible"
            :list="firstDayOfMonthList"
            :columns="4"
            :has-search="false"
        />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.dashboard.transaction_exclusion') }}:</div>
        <account-select v-model="excludedAccountsList" :isMultiSelect="true" />
        <category-select v-model="excludedCategoriesList" :isMultiSelect="true" />
        <tag-select v-model="excludedTagsList" :isMultiSelect="true" :autoSelectParents="false" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore.js'
import { useDataStore } from '~/stores/dataStore.js'
import UIUtils from '~/utils/UIUtils.js'
import { useToolbar } from '~/composables/useToolbar.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import { useI18n } from 'vue-i18n'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const { t } = useI18n()
const profileStore = useProfileStore()

const areEmptyAccountsVisible = ref(false)
const showDecimal = ref(false)
const excludedAccountsList = ref([])
const excludedCategoriesList = ref([])
const excludedTagsList = ref([])

const firstDayOfMonth = ref(null)
const firstDayOfMonthList = [...Array(27).keys()].map((item) => item + 1)
const isDropdownFirstDayVisible = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'dashboard.areEmptyAccountsVisible', ref: areEmptyAccountsVisible },
  { store: profileStore, path: 'dashboard.showDecimal', ref: showDecimal },
  { store: profileStore, path: 'dashboard.excludedAccountsList', ref: excludedAccountsList },
  { store: profileStore, path: 'dashboard.excludedCategoriesList', ref: excludedCategoriesList },
  { store: profileStore, path: 'dashboard.excludedTagsList', ref: excludedTagsList },
  { store: profileStore, path: 'dashboard.firstDayOfMonth', ref: firstDayOfMonth },

]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  let response = await profileStore.writeProfile()
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.dashboard.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

const onGoToDashboardCardsOrder = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)

onMounted(() => {
  animateSettings()
})
</script>
