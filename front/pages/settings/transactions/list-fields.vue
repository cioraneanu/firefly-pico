<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset class="">
        <div class="van-cell-group-title mb-0">{{ $t('settings.transactions.list_fields.fields') }}:</div>

        <div class="flex-column van-cell p-10">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-5" @click="onClickIsVisible(element)">
                <div class="van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select">
                  <app-icon v-if="element.icon" :icon="element.icon" :size="20" />
                  <div class="flex-1 text-size-14">{{ element.t ? $t(element.t) : element.name }}</div>
                  <app-icon :icon="getIsVisibleIcon(element)" :size="20" />
                </div>
              </div>
            </template>
          </app-repeater>
        </div>
      </van-cell-group>

      <van-cell-group inset>
        <app-select
          :popupTitle="$t('settings.transactions.list_fields.select_hero_icons')"
          v-model="heroIcons"
          v-model:showDropdown="isHeroIconsDropdownVisible"
          :list="heroIconsList"
          :is-multi-select="true"
          :columns="1"
          :has-search="false"
          :get-display-value="getDisplayValueHero">
          <template #label>
            <div class="flex-center-vertical">
              <div class="">{{ $t('settings.transactions.list_fields.hero_icons') }}</div>
              <span class="info ml-5">{{ $t('settings.transactions.list_fields.right_side_card') }}</span>
            </div>
          </template>
        </app-select>
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
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import { transactionListHeroIconList, transactionListFieldList } from '~/constants/TransactionConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  let isListOk = profileStore.transactionListFieldsConfig.length === transactionListFieldList.length
  fieldsList.value = isListOk ? profileStore.transactionListFieldsConfig : transactionListFieldList
}

// ----- Hero Icons ----

const heroIconsList = transactionListHeroIconList
const isHeroIconsDropdownVisible = ref(false)
const heroIcons = ref([])
const getDisplayValueHero = (item) => item.t ? t(item.t) : item.name

const syncedSettings = [{ store: profileStore, path: 'heroIcons', ref: heroIcons }]

watchSettingsStore(syncedSettings)
// -----

const onSave = async () => {
  profileStore.transactionListFieldsConfig = fieldsList.value
  saveSettingsToStore(syncedSettings)
  let response = await profileStore.writeProfile()
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
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
