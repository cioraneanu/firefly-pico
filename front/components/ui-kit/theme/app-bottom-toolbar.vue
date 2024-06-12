<template>
  <van-tabbar @change="onChange" v-model="activeTab" :safe-area-inset-bottom="true" :fixed="true">
    <van-tabbar-item :name="tabConstants.dashboard" @click="onChange(tabConstants.dashboard)">
      Home
      <template #icon="{ active }">
        <!--        <IconDeviceDesktopAnalytics />-->
        <app-icon :icon="TablerIconConstants.dashboard" :size="20" :stroke="getStrokeWidth(active)" />
      </template>
    </van-tabbar-item>

    <van-tabbar-item :name="tabConstants.transactionList" @click="onChange(tabConstants.transactionList)">
      Transactions
      <template #icon="{ active }">
        <app-icon :icon="TablerIconConstants.transaction" :size="20" :stroke="getStrokeWidth(active)" />
      </template>
    </van-tabbar-item>



    <van-tabbar-item  :name="tabConstants.add" @click="onChange(tabConstants.add)" >
      <template #icon="{ active }">
        <transition name="zoom-fade">
          <svg-add-icon v-if="isAddButtonVisible" width="40" height="40"/>
        </transition>
      </template>
    </van-tabbar-item>

    <van-tabbar-item :name="tabConstants.extras" @click="onChange(tabConstants.extras)">
      Extras
      <template #icon="{ active }">
        <app-icon :icon="TablerIconConstants.extras" :size="20" :stroke="getStrokeWidth(active)" />
      </template>
    </van-tabbar-item>

    <van-tabbar-item :name="tabConstants.settings" @click="onChange(tabConstants.settings)" :dot="appStore.isNewVersionAvailable">
      Settings
      <template #icon="{ active }">
        <app-icon :icon="TablerIconConstants.settings" :size="20" :stroke="getStrokeWidth(active)" />
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { useAppStore } from '~/stores/appStore'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants'
import anime from 'animejs'

const dataStore = useDataStore()
const appStore = useAppStore()
const route = useRoute()

const tabConstants = {
  add: 'add',
  transactionList: 'transactionList',
  dashboard: 'dashboard',
  transactionTemplateList: 'transactionTemplateList',
  extras: 'extras',
  settings: 'settings',
}
const activeTab = ref(null)

const isAddButtonVisible = computed(() => route.path !== RouteConstants.ROUTE_TRANSACTION_ID && route.path !== RouteConstants.ROUTE_HOME)
watch(
  () => route.path,
  (newValue) => {
    if (newValue === RouteConstants.ROUTE_TRANSACTION_LIST || RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_ID, newValue)) {
      activeTab.value = tabConstants.transactionList
    }

    if (newValue === RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST || RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID, newValue)) {
      activeTab.value = tabConstants.transactionTemplateList
    }

    if (
      [RouteConstants.ROUTE_EXTRAS, RouteConstants.ROUTE_TAG_LIST, RouteConstants.ROUTE_ACCOUNT_LIST, RouteConstants.ROUTE_CATEGORY_LIST].includes(newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_TAG_ID, newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_ACCOUNT_ID, newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_CATEGORY_ID, newValue)
    ) {
      activeTab.value = tabConstants.extras
    }

    if ([RouteConstants.ROUTE_SETTINGS].includes(newValue)) {
      activeTab.value = tabConstants.settings
    }
  },
  { deep: true, immediate: true },
)

onMounted(async () => {

})

// watch(isAddButtonVisible, (newValue) => {
//   console.log('isAddButtonVisible', {newValue})
//   if (newValue) {
//     anime({
//       targets: '.bottom-add-button',
//       scale: 1,
//     });
//   } else {
//     anime({
//       targets: '.bottom-add-button',
//       scale: 0,
//     });
//   }
//
// }, {immediate: true})



const getStrokeWidth = (active) => {
  return active ? 2.2 : 1.7
}

const onChange = async (code) => {
  switch (code) {
    case tabConstants.dashboard:
      await navigateTo(RouteConstants.ROUTE_DASHBOARD)
      break

    case tabConstants.add:
      await navigateTo(RouteConstants.ROUTE_TRANSACTION_ID)
      break

    case tabConstants.transactionList:
      await navigateTo(RouteConstants.ROUTE_TRANSACTION_LIST)
      break

    case tabConstants.transactionTemplateList:
      await navigateTo(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)
      break

    case tabConstants.extras:
      await navigateTo(RouteConstants.ROUTE_EXTRAS)
      break

    case tabConstants.settings:
      await navigateTo(RouteConstants.ROUTE_SETTINGS)
      break
  }
}
</script>
