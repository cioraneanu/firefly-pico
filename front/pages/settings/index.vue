<template>

  <div class="app-form">

    <app-top-toolbar/>


    <van-cell-group inset style="overflow: auto">

      <app-field-link
          label="App config"
          :icon="TablerIconConstants.settings"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_APP_CONFIG)"
      />

      <app-field-link
          label="UI preferences"
          :icon="TablerIconConstants.settingsUI"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_UI)"
      />

      <app-field-link
          label="Date preferences"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_DATE)"
      />

      <app-field-link
          label="New transaction defaults"
          :icon="TablerIconConstants.settingsNewTransactionDefaults"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_NEW_TRANSACTION_DEFAULTS)"
      />

      <app-field-link
          label="Transaction config"
          :icon="TablerIconConstants.settingsUserPreferences"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS)"
      />



      <app-field-link
          label="About"
          :icon="TablerIconConstants.settingsAbout"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ABOUT)"
      />


    </van-cell-group>

    <div class="text-muted subtitle flex-center mt-20 flex-column">
      <div>Version {{ appStore.currentAppVersion }}</div>

      <div v-if="appStore.isNewVersionAvailable" class="latest-version-badge">
        New version available: {{ appStore.latestAppVersion }} 🎉
      </div>


      <!--      <svgo-about />-->
      <!--      <svgo-flat-color-icons-about style="width: 20px" />-->

      <!--      <IconAlarm />-->


      <!--      <icon-phone/>-->
      <!--      <icon-album/>-->


      <!--      <component is="icon-Credit-card"/>-->

      <!--      <svgo-xxx class="" style="width: 20px" />-->


      <!--      <nuxt-icon name="duotone-line/Call/Call Cancel" filled />-->

      <!--      <icon-dislile />-->

    </div>

    <div>
      <!--      <div>-->
      <!--        1.-->
      <!--        <IconAnalyze/>-->
      <!--      </div>-->
      <!--      <div>-->
      <!--        2.-->
      <!--        <component is="IconAnalyze"/>-->
      <!--      </div>-->

      <!--      <div>-->
      <!--        3.-->
      <!--        <IconAlarm  :size="20"/>-->
      <!--      </div>-->

      <!--      <div>-->
      <!--        4.-->
      <!--        <component is="IconAlarm"  :size="20"/>-->
      <!--      </div>-->
    </div>

  </div>


</template>

<!--import IconDislike from '~/assets/icons/duotone-line/Like/Dislike.svg'-->
import { ref, onMounted } from 'vue';
import { useAppStore } from '~/stores/appStore'
import

<script setup>

import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'

import TablerIconConstants from '~/constants/TablerIconConstants'

const appStore = useAppStore()


// const onGoToSettingsUserPreferenceTransactions = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS)
//
// const onGoToSettingsAppConfig = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_APP_CONFIG)
// const onGoToSettingsUserPreferenceTransactions = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS)
// const onGoToSettingsUserPreferenceDates = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_DATE)
// const onGoToSettingsAbout = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_ABOUT)

const toolbar = useToolbar()
toolbar.init({ title: 'Settings' })

</script>