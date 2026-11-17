<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <app-card :section="$t('about.info')" :form="false">
        <div class="mx-card__c">
          <ul class="mx-ul">
            <li v-for="key in infoKeys" :key="key">
              <app-icon :icon="IconInfoCircle" :size="15" :stroke="2" />
              <span>{{ $t(key).replace(/^-\s*/, '') }}</span>
            </li>
          </ul>
        </div>
      </app-card>

      <h2 class="mx-sec">
        <span>{{ $t('about.credits') }}</span>
      </h2>
      <div class="mx-list">
        <a v-for="credit in credits" :key="credit.url" class="mx-row mid" :href="credit.url" target="_blank">
          <span class="mx-lead sm"><app-icon :icon="credit.icon" :size="16" :stroke="2" /></span>
          <span class="mx-row__m">
            <span class="mx-row__t">{{ credit.title }}</span>
            <span class="mx-row__s">{{ $t(credit.subtitle) }}</span>
          </span>
          <span class="mx-chev"><app-icon :icon="IconExternalLink" :size="16" :stroke="2" /></span>
        </a>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { REPO_URL } from '~/core/constants/Constants'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconApi, IconArrowsExchange, IconBrandGithub, IconCode, IconExternalLink, IconIcons, IconInfoCircle, IconPhoto } from '@tabler/icons-vue'

const { t } = useI18n()

const infoKeys = ['about.items_list_deleted', 'about.list_updated', 'about.popups_dismissed', 'about.dashboard_clickable']

const credits = [
  { title: 'GitHub', subtitle: 'about.credit_developed_by', url: REPO_URL, icon: IconBrandGithub },
  { title: 'Laravel', subtitle: 'about.credit_using', url: 'https://laravel.com/', icon: IconCode },
  { title: 'Nuxt', subtitle: 'about.credit_using', url: 'https://nuxt.com/', icon: IconCode },
  { title: 'Firefly III', subtitle: 'about.credit_consuming', url: 'https://www.firefly-iii.org', icon: IconApi },
  { title: 'Exchange Rate API', subtitle: 'about.credit_exchange_rate', url: 'https://www.exchangerate-api.com', icon: IconArrowsExchange },
  { title: 'Tabler Icons', subtitle: 'about.credit_iconpacks', url: 'https://tabler.io/icons', icon: IconIcons },
  { title: 'Fluent UI System Icons', subtitle: 'about.credit_iconpacks', url: 'https://github.com/microsoft/fluentui', icon: IconIcons },
  { title: 'Circle Avatar Vectors by Laura Reen', subtitle: 'about.credit_iconpacks', url: 'https://www.svgrepo.com/author/Laura%20Reen', icon: IconIcons },
  { title: 'SVG Repo', subtitle: 'about.credit_iconpacks', url: 'https://www.svgrepo.com/', icon: IconIcons },
  { title: 'Freepik', subtitle: 'about.credit_iconpacks', url: 'https://www.freepik.com/', icon: IconIcons },
  { title: 'unDraw', subtitle: 'about.credit_illustrations', url: 'https://undraw.co', icon: IconPhoto },
]

const toolbar = useToolbar()
toolbar.init({
  title: t('about.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
