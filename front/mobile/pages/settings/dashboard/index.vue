<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card-info>
          <app-field-link :icon="IconLayoutDashboard" :label="$t('settings.dashboard.cards_order')" @click="onGoToDashboardCardsOrder" />
        </app-card-info>

        <app-card :section="$t('settings.dashboard.config')">
          <app-boolean v-model="areEmptyAccountsVisible" :label="$t('settings.dashboard.show_empty_accounts')" />
          <div class="mx-hr" />
          <app-boolean v-model="showDecimal" :label="$t('settings.dashboard.show_decimal_places')" />
          <div class="mx-hr" />
          <app-select
            v-model="firstDayOfMonth"
            v-model:show-dropdown="isDropdownFirstDayVisible"
            :label="$t('settings.formatting.first_day_of_month')"
            :popup-title="$t('settings.formatting.select_first_day_of_month')"
            :list="firstDayOfMonthList"
            :has-search="false"
          />
        </app-card>

        <app-card :section="$t('settings.dashboard.transaction_exclusion')">
          <account-select v-model="excludedAccountsList" :is-multi-select="true" />
          <category-select v-model="excludedCategoriesList" :is-multi-select="true" />
          <tag-select v-model="excludedTagsList" :is-multi-select="true" :auto-select-parents="false" />
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore.js'
import UIUtils from '~/core/utils/UIUtils.js'
import { useToolbar } from '~/mobile/composables/useToolbar.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { useI18n } from 'vue-i18n'
import { IconLayoutDashboard } from '@tabler/icons-vue'

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
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
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
