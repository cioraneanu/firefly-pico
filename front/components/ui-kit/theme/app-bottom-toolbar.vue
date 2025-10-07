<template>
  <van-tabbar v-if="!isKeyboardVisible" :safe-area-inset-bottom="true" :fixed="true">
    <div class="display-flex w-100">

      <div v-for="button of buttonsList" :class="getButtonClass(button)" @click="onClick(button)">
        <app-icon :icon="getButtonIcon(button)" :size="28" />
        <div class="text-size-11">{{ button.title }}</div>
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

const route = useRoute()

const { t } = useI18n()
const activeButton = ref(null)

const button = {
  dashboard: { title: t('toolbar.home'), iconOn: 'svgo-toolbar-dashboard-on', iconOff: 'svgo-toolbar-dashboard-off', code: 'dashboard', route: RouteConstants.ROUTE_DASHBOARD },
  transactions: { title: t('toolbar.transactions'), iconOn: 'svgo-toolbar-transactions-on', iconOff: 'svgo-toolbar-transactions-off', code: 'transactions', route: RouteConstants.ROUTE_TRANSACTION_LIST },
  add: { title: t('toolbar.home'), iconOn: 'svgo-toolbar-add', iconOff: 'svgo-toolbar-add', code: 'add', route: RouteConstants.ROUTE_TRANSACTION_ID },
  extras: { title: t('toolbar.extras'), iconOn: 'svgo-toolbar-extras-on', iconOff: 'svgo-toolbar-extras-off', code: 'extras', route: RouteConstants.ROUTE_EXTRAS },
  settings: { title: t('toolbar.settings'), iconOn: 'svgo-toolbar-settings-on', iconOff: 'svgo-toolbar-settings-off', code: 'settings', route: RouteConstants.ROUTE_SETTINGS },
}

const buttonsList = Object.values(button)


const isButtonSelected = (button) => button.code === activeButton.value?.code
const getButtonIcon = (button) => isButtonSelected(button) ? button.iconOn : button.iconOff


const getButtonClass = (button) => ({
  'flex-1 flex-center flex-column cursor-pointer': true,
  [button.class]: button.class,
  selected: isButtonSelected(button)
})

const { isKeyboardVisible } = useKeyboard()

watch(
  () => route.path,
  (newValue, oldValue) => {
    if (isEqual(newValue, oldValue)) {
      return
    }

    if (newValue === RouteConstants.ROUTE_TRANSACTION_LIST || RouteConstants.isForm(RouteConstants.ROUTE_TRANSACTION_ID, newValue)) {
      activeButton.value = button.transactions
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
      activeButton.value = button.extras
    }

    if ([RouteConstants.ROUTE_SETTINGS].includes(newValue)) {
      activeButton.value = button.settings
    }

    if ([RouteConstants.ROUTE_DASHBOARD].includes(newValue)) {
      activeButton.value = button.dashboard
    }
  },
  { deep: true, immediate: true },
)

const onClick = async (button) => {
  await navigateTo(button.route)
}
</script>
