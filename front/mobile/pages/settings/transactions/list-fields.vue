<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset class="">
        <div class="van-cell-group-title mb-0">{{ $t('settings.transactions.list_fields.fields') }}:</div>

        <div class="flex-col van-cell p-2.5">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-1.25 cursor-pointer" @click="onClickIsVisible(element)">
                <div class="van-field__body flex items-center gap-1 pointer-events-none select-none">
                  <app-icon v-if="element.icon" :icon="element.icon" :size="20" />
                  <div class="flex-1 text-14">{{ element.t ? $t(element.t) : element.name }}</div>
                  <app-icon :icon="getIsVisibleIcon(element)" :size="20" />
                </div>
              </div>
            </template>
          </app-repeater>
        </div>
      </van-cell-group>

      <van-cell-group inset>
        <app-select
          v-model="heroIcons"
          v-model:show-dropdown="isHeroIconsDropdownVisible"
          :popup-title="$t('settings.transactions.list_fields.select_hero_icons')"
          :list="heroIconsList"
          :is-multi-select="true"
          :columns="1"
          :has-search="false"
          :get-display-value="getDisplayValueHero">
          <template #label>
            <div class="flex items-center">
              <div class="">{{ $t('settings.transactions.list_fields.hero_icons') }}</div>
              <span class="info ml-1.25">{{ $t('settings.transactions.list_fields.right_side_card') }}</span>
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
import { useProfileStore } from '~/core/stores/profileStore'

import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { transactionListHeroIconList, transactionListFieldList } from '~/core/constants/TransactionConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()


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
  const isListOk = profileStore.transactionListFieldsConfig.length === transactionListFieldList.length
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
  const response = await profileStore.writeProfile()
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
