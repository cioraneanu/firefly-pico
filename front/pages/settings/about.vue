<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">{{ $t('about.info') }}</div>

      <div class="text-muted text-size-12 p-20 pt-10">
        <div v-html="$t('about.items_list_deleted')"></div>
        <div v-html="$t('about.list_updated')"></div>
        <div v-html="$t('about.popups_dismissed')"></div>
        <div v-html="$t('about.dashboard_clickable')"></div>
      </div>
    </van-cell-group>

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">{{ $t('about.credits') }}</div>
      <div class="text-muted text-size-12 p-20 pt-10">
        <div v-html="$t('about.developed_by')"></div>
        <br />
        <div v-html="$t('about.using_laravel_nuxt')"></div>
        <div v-html="$t('about.consuming_firefly')"></div>
        <div v-html="$t('about.ui_theme_vant')"></div>
        <div v-html="$t('about.exchange_rate_api')"></div>
        <br />
        <div v-html="$t('about.iconpacks_tabler')"></div>
        <div v-html="$t('about.iconpacks_fluent')"></div>
        <div v-html="$t('about.iconpacks_circle_avatar')"></div>
        <div v-html="$t('about.iconpacks_svg_repo')"></div>
        <div v-html="$t('about.iconpacks_freepik')"></div>
        <div v-html="$t('about.illustrations_undraw')"></div>
      </div>
    </van-cell-group>
  </div>
</template>

<script setup>
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { REPO_URL } from '~/constants/Constants'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const toolbar = useToolbar()
toolbar.init({
  title: t('about.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
