<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <h2 class="mx-sec">
          <span>{{ $t('settings.transactions.list_fields.fields') }}</span>
        </h2>
        <settings-order-list v-model="fieldsList" :hint="$t('settings.reorder_hint_fields')" />

        <app-card>
          <app-select
            v-model="heroIcons"
            v-model:show-dropdown="isHeroIconsDropdownVisible"
            :label="$t('settings.transactions.list_fields.hero_icons')"
            :popup-title="$t('settings.transactions.list_fields.select_hero_icons')"
            :list="heroIconsList"
            :is-multi-select="true"
            :has-search="false"
            :get-display-value="getDisplayValueHero"
          >
            <template #extra>
              <p class="mx-d">{{ $t('settings.transactions.list_fields.right_side_card') }}</p>
            </template>
          </app-select>
        </app-card>
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
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { transactionListHeroIconList, transactionListFieldList } from '~/core/constants/TransactionConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const init = () => {
  const isListOk = profileStore.transactionListFieldsConfig.length === transactionListFieldList.length
  fieldsList.value = isListOk ? profileStore.transactionListFieldsConfig : transactionListFieldList
}

// ----- Hero Icons ----

const heroIconsList = transactionListHeroIconList
const isHeroIconsDropdownVisible = ref(false)
const heroIcons = ref([])
const getDisplayValueHero = (item) => (item.t ? t(item.t) : item.name)

const syncedSettings = [{ store: profileStore, path: 'heroIcons', ref: heroIcons }]

watchSettingsStore(syncedSettings)
// -----

const onSave = async () => {
  profileStore.transactionListFieldsConfig = fieldsList.value
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
  init()
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.transactions.list_fields.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
