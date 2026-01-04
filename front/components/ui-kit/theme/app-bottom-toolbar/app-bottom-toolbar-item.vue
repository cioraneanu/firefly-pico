<template>
  <div @click="onChange" class="flex-1 flex-center flex-column cursor-pointer">
    <div>
      <slot name="icon">
        <app-icon :icon="icon" :size="20" />
      </slot>
    </div>
    <div :class="labelClass">{{ label }}</div>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import RouteConstants from '~/constants/RouteConstants.js'
import IconDashboard1 from '~/assets/icons/custom/dashboard1.svg'
import IconDashboard2 from '~/assets/icons/custom/dashboard2.svg'
import IconTransactions1 from '~/assets/icons/custom/transactions1.svg'
import IconTransactions2 from '~/assets/icons/custom/transactions2.svg'
import IconExtra1 from '~/assets/icons/custom/extra1.svg'
import IconExtra2 from '~/assets/icons/custom/extra2.svg'
import IconSettings1 from '~/assets/icons/custom/settings2.svg'
import IconSettings2 from '~/assets/icons/custom/settings2.svg'

const props = defineProps({
  route: {},
})

const onChange = async () => {
  await navigateTo(props.route)
}

const labelClass = computed(() => ({
  'text-size-11': true,
  'font-600': props.isSelected,
}))

const { t } = useI18n()
const appStore = useAppStore()

const icons = {
  [RouteConstants.ROUTE_DASHBOARD]: {
    iconOn: IconDashboard1,
    iconOff: IconDashboard1,
    label: t('toolbar.home'),
  },
  [RouteConstants.ROUTE_TRANSACTION_LIST]: {
    iconOn: IconTransactions1,
    iconOff: IconTransactions2,
    label: t('toolbar.transactions'),
  },
  [RouteConstants.ROUTE_EXTRAS]: {
    iconOn: IconExtra1,
    iconOff: IconExtra2,
    label: t('toolbar.extras'),
  },
  [RouteConstants.ROUTE_SETTINGS]: {
    iconOn: IconSettings1,
    iconOff: IconSettings2,
    label: t('toolbar.settings'),
  },
}

const icon = computed(() => {
  let isActiveKey = (appStore.activePage === props.route) ? 'iconOn' : 'iconOff'
  console.log('debug', { isActiveKey, 'props.route': props.route, 'icons[props.route]': icons[props.route] })

  return icons[props.route][isActiveKey]
})

const label = computed(() => {
  return icons[props.route]?.label
})
</script>
