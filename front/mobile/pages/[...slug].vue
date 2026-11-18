<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <empty-list filtered :title="$t('general.page_not_found')" :subtitle="$t('general.page_not_found_subtitle', { path: route.path })">
        <template #action>
          <button type="button" class="mx-btn pri" @click="navigateTo(RouteConstants.ROUTE_DASHBOARD)">{{ $t('general.go_to_dashboard') }}</button>
        </template>
      </empty-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'

const { t } = useI18n()
const route = useRoute()

useToolbar().init({ title: t('general.page_not_found'), backRoute: RouteConstants.ROUTE_DASHBOARD })
</script>
