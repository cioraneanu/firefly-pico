<template>
  <van-tabbar v-if="!isKeyboardVisible" :safe-area-inset-bottom="true" :fixed="true">
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_DASHBOARD" />
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_TRANSACTION_LIST" />

    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_TRANSACTION_ID">
      <template #icon>
        <div class="flex-center flex-column">
          <icon-square-rounded-plus-filled :size="36" color="#1976D2" />
          <!--          <div class="app-bottom-toolbar-item flex-center">New</div>-->
        </div>
      </template>
    </app-bottom-toolbar-item>

    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_EXTRAS" />
    <app-bottom-toolbar-item :route="RouteConstants.ROUTE_SETTINGS" :dot="appStore.isNewVersionAvailable" />
  </van-tabbar>
</template>

<script setup>
import { isEqual } from 'lodash'
import { useDataStore } from '~/stores/dataStore.js'
import { useProfileStore } from '~/stores/profileStore.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { IconSquareRoundedPlusFilled } from '@tabler/icons-vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'
import IconDashboard1 from '~/assets/icons/custom/dashboard1.svg'
import IconDashboard2 from '~/assets/icons/custom/dashboard2.svg'

const dataStore = useDataStore()
const profileStore = useProfileStore()
const appStore = useAppStore()
const route = useRoute()

const { isKeyboardVisible } = useKeyboard()

onMounted(async () => {})
</script>
