<template>
  <van-tabbar v-if="!isKeyboardVisible" :safe-area-inset-bottom="true" :fixed="true" class="app-bottom-toolbar">
    <div class="display-flex w-100">
      <div v-for="button of buttonTypesList" :class="getButtonClass(button)" @click="onClick(button)">
        <template v-if="button.code === buttonType.add.code">
          <div class="app-bottom-toolbar-add">
            <component :is="getButtonIcon(button)" />
          </div>
        </template>

        <template v-else>
          <component :is="getButtonIcon(button)" style="width: 30px; height: 30px" />
          <div class="text-size-11">{{ button.title }}</div>
        </template>
      </div>
    </div>
  </van-tabbar>
</template>

<script setup>
import { isEqual } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useProfileStore } from '~/stores/profileStore'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { animateBottomToolbarAddButton } from '~/utils/AnimationUtils.js'
import DashboardOn from '@/assets/icons/toolbar/dashboard-on.svg'
import DashboardOff from '@/assets/icons/toolbar/dashboard-off.svg'
import TransactionOn from '@/assets/icons/toolbar/transactions-on.svg'
import TransactionOff from '@/assets/icons/toolbar/transactions-off.svg'
import ExtrasOn from '@/assets/icons/toolbar/extras-on.svg'
import ExtrasOff from '@/assets/icons/toolbar/extras-off.svg'
import SettingsOn from '@/assets/icons/toolbar/settings-on.svg'
import SettingsOff from '@/assets/icons/toolbar/settings-off.svg'
import IconAdd from '@/assets/icons/toolbar/add.svg'

const route = useRoute()

const { t } = useI18n()
const activeButton = ref(null)

const buttonType = {
  dashboard: { title: t('toolbar.home'), iconOn: DashboardOn, iconOff: DashboardOff, code: 'dashboard', route: RouteConstants.ROUTE_DASHBOARD },
  transactions: {
    title: t('toolbar.transactions'),
    iconOn: TransactionOn,
    iconOff: TransactionOff,
    code: 'transactions',
    route: RouteConstants.ROUTE_TRANSACTION_LIST,
  },
  add: { title: t('add'), iconOn: IconAdd, iconOff: IconAdd, code: 'add', route: RouteConstants.ROUTE_TRANSACTION_ID },
  extras: { title: t('toolbar.extras'), iconOn: ExtrasOn, iconOff: ExtrasOff, code: 'extras', route: RouteConstants.ROUTE_EXTRAS },
  settings: { title: t('toolbar.settings'), iconOn: SettingsOn, iconOff: SettingsOff, code: 'settings', route: RouteConstants.ROUTE_SETTINGS },
}

const buttonTypesList = Object.values(buttonType)

const isButtonSelected = (button) => button.code === activeButton.value?.code
const getButtonIcon = (button) => (isButtonSelected(button) ? button.iconOn : button.iconOff)

const getButtonClass = (button) => ({
  'flex-1 flex-center flex-column cursor-pointer': true,
  [button.class]: button.class,
  selected: isButtonSelected(button),
})

const { isKeyboardVisible } = useKeyboard()

watch(
  () => route.path,
  (newValue, oldValue) => {
    if (isEqual(newValue, oldValue)) {
      return
    }

    if (newValue === RouteConstants.ROUTE_TRANSACTION_LIST || RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_ID, newValue)) {
      activeButton.value = buttonType.transactions
    }

    if (
      [RouteConstants.ROUTE_EXTRAS, RouteConstants.ROUTE_TAG_LIST, RouteConstants.ROUTE_ACCOUNT_LIST, RouteConstants.ROUTE_CATEGORY_LIST, RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST].includes(
        newValue,
      ) ||
      RouteConstants.isForm(RouteConstants.ROUTE_TAG_ID, newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_ACCOUNT_ID, newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_CATEGORY_ID, newValue) ||
      RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID, newValue)
    ) {
      activeButton.value = buttonType.extras
    }

    if ([RouteConstants.ROUTE_SETTINGS].includes(newValue)) {
      activeButton.value = buttonType.settings
    }

    if ([RouteConstants.ROUTE_DASHBOARD].includes(newValue)) {
      activeButton.value = buttonType.dashboard
    }
  },
  { deep: true, immediate: true },
)

const onClick = async (button) => {
  await navigateTo(button.route)
}
</script>
