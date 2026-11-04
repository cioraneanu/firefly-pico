<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">{{ $t('about.info') }}</div>

      <div class="text-muted text-12 p-5 pt-2.5">
        <div>{{ $t('about.items_list_deleted') }}</div>
        <div>{{ $t('about.list_updated') }}</div>
        <div>{{ $t('about.popups_dismissed') }}</div>
        <div>{{ $t('about.dashboard_clickable') }}</div>
      </div>
    </van-cell-group>

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">{{ $t('about.credits') }}</div>
      <div class="text-muted text-12 p-5 pt-2.5">
        <div v-html="$t('about.developed_by', { url: REPO_URL })"/>
        <br >
        <div v-html="$t('about.using_laravel_nuxt')"/>
        <div v-html="$t('about.consuming_firefly')"/>
        <div v-html="$t('about.ui_theme_vant')"/>
        <div v-html="$t('about.exchange_rate_api')"/>
        <br >
        <div v-html="$t('about.iconpacks_tabler')"/>
        <div v-html="$t('about.iconpacks_fluent')"/>
        <div v-html="$t('about.iconpacks_circle_avatar')"/>
        <div v-html="$t('about.iconpacks_svg_repo')"/>
        <div v-html="$t('about.iconpacks_freepik')"/>
        <div v-html="$t('about.illustrations_undraw')"/>
      </div>
    </van-cell-group>
  </div>
</template>

<script setup>
import { useProfileStore } from '~/core/stores/profileStore'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { REPO_URL } from '~/core/constants/Constants'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const toolbar = useToolbar()
toolbar.init({
  title: t('about.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
