<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <app-boolean label="Hide accounts with 0 amount:" v-model="areEmptyAccountsVisible" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const appStore = useAppStore()
const dataStore = useDataStore()


const areEmptyAccountsVisible = ref(false)

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.dashboard.areEmptyAccountsVisible = areEmptyAccountsVisible.value
  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  areEmptyAccountsVisible.value = appStore.dashboard.areEmptyAccountsVisible

}

const toolbar = useToolbar()
toolbar.init({
  title: 'Dashboard preferences',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
