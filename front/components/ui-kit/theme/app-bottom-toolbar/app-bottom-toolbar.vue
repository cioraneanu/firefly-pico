<template>
  <van-tabbar v-if="!isKeyboardVisible" :safe-area-inset-bottom="true" :fixed="true">

    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_DASHBOARD"/>
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_TRANSACTION_LIST"/>


    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_TRANSACTION_ID">
      <template #icon>
        <svg-add-icon width="40" height="40" id="add-new-transaction" />
      </template>
    </app-bottom-toolbar-item>


    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_EXTRAS"/>
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_SETTINGS"/>
  </van-tabbar>
</template>

<script setup>
import { isEqual } from 'lodash'
import { useDataStore } from '~/stores/dataStore.js'
import { useProfileStore } from '~/stores/profileStore.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'
import IconDashboard1 from '~/assets/icons/custom/dashboard1.svg'
import IconDashboard2 from '~/assets/icons/custom/dashboard2.svg'


const dataStore = useDataStore()
const profileStore = useProfileStore()
const appStore = useAppStore()
const route = useRoute()

const tabConstants = {
  add: 'add',
  transactionList: 'transactionList',
  dashboard: 'dashboard',
  extras: 'extras',
  settings: 'settings',
}

const { isKeyboardVisible } = useKeyboard()

const iconDashboard = computed(() => {
  return {
    on: IconDashboard1,
    off: IconDashboard1,
  }
})

const iconTransactionList = computed(() => {
  return useRoute().path === RouteConstants.ROUTE_TRANSACTION_LIST ? 'svgo-custom-transactions2' : 'svgo-custom-transactions1'
})

// watch(
//   () => route.path,
//   (newValue, oldValue) => {
//     if (isEqual(newValue, oldValue)) {
//       return
//     }
//
//     if (newValue === RouteConstants.ROUTE_TRANSACTION_LIST || RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_ID, newValue)) {
//       activeTab.value = tabConstants.transactionList
//     }
//
//     if (
//       [RouteConstants.ROUTE_EXTRAS, RouteConstants.ROUTE_TAG_LIST, RouteConstants.ROUTE_ACCOUNT_LIST, RouteConstants.ROUTE_CATEGORY_LIST, RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST].includes(
//         newValue,
//       ) ||
//       RouteConstants.isForm(RouteConstants.ROUTE_TAG_ID, newValue) ||
//       RouteConstants.isForm(RouteConstants.ROUTE_ACCOUNT_ID, newValue) ||
//       RouteConstants.isForm(RouteConstants.ROUTE_CATEGORY_ID, newValue) ||
//       RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID, newValue)
//     ) {
//       activeTab.value = tabConstants.extras
//     }
//
//     if ([RouteConstants.ROUTE_SETTINGS].includes(newValue)) {
//       activeTab.value = tabConstants.settings
//     }
//   },
//   { deep: true, immediate: true },
// )

onMounted(async () => {})



const onNewTransaction = () => {
  animateBottomToolbarAddButton()
  onChange(tabConstants.add)
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

    case tabConstants.extras:
      await navigateTo(RouteConstants.ROUTE_EXTRAS)
      break

    case tabConstants.settings:
      await navigateTo(RouteConstants.ROUTE_SETTINGS)
      break
  }
}
</script>
