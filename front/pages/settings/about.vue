<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">Info</div>

      <div class="text-muted text-size-12 p-20 pt-10">
        <div>- Items in a list can be deleted with a horizontal swipe</div>
        <div>- A list can be updated via pull to refresh</div>
        <div>- Popups that appear from the bottom can be dismissed with a swipe down gesture</div>
        <div>- On the dashboard most of the icons and chart bars are clickable.</div>
      </div>
    </van-cell-group>

    <van-cell-group inset>
      <div class="van-cell-group-title mb-0">Credits</div>
      <div class="text-muted text-size-12 p-20 pt-10">
        <div>- Developed by Mihai Cioraneanu - <a :href="REPO_URL">Source on GitHub</a></div>
        <br />
        <div>
          - Using <a href="https://laravel.com/" target="_blank">Laravel</a> and
          <a href="https://nuxt.com/" target="_blank">Nuxt</a>
        </div>
        <div>- Consuming the <a href="https://www.firefly-iii.org" target="_blank">Firefly III</a> REST API</div>
        <div>- With a UI theme based on <a href="https://vant-ui.github.io" target="_blank">Vant</a></div>
        <div>- Exchange rate by <a href="https://www.exchangerate-api.com">Exchange Rate API</a></div>
        <br />
        <div>- IconPacks: <a href="https://tabler.io/icons" target="_blank">Tablr Icons</a></div>
        <div>
          - IconPacks:
          <a href="https://github.com/microsoft/fluentui" target="_blank">Fluent UI System Icons</a>
        </div>
        <div>
          - IconPacks:
          <a href="https://www.svgrepo.com/author/Laura%20Reen" target="_blank">Circle Avatar Vectors by Laura Reen</a>
        </div>
        <div>- IconPacks: <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a></div>
        <div>- Illustrations: <a href="https://undraw.co" target="_blank">unDraw</a></div>
      </div>
    </van-cell-group>
  </div>
</template>

<script setup>
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { REPO_URL } from '~/constants/Constants'

const appStore = useAppStore()
const dataStore = useDataStore()

const toolbar = useToolbar()
toolbar.init({
  title: 'About',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
