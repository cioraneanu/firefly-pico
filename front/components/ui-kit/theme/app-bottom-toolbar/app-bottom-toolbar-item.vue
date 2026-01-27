<template>
  <div @click="onChange" class="flex-1 flex-center flex-column cursor-pointer " style="gap: 2px">
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
import IconSettings1 from '~/assets/icons/custom/settings1.svg'
import IconSettings2 from '~/assets/icons/custom/settings2.svg'

const props = defineProps({
  route: {},
})

const onChange = async () => {
  await navigateTo(props.route)
}

const labelClass = computed(() => ({
  'app-bottom-toolbar-item': true,
  'selected': isSelected.value,
}))

const { t } = useI18n()
const appStore = useAppStore()

const icons = {
  [RouteConstants.ROUTE_DASHBOARD]: {
    iconOn: IconDashboard2,
    iconOff: IconDashboard1,
    label: t('toolbar.home'),
  },
  [RouteConstants.ROUTE_TRANSACTION_LIST]: {
    iconOn: IconTransactions2,
    iconOff: IconTransactions1,
    label: t('toolbar.transactions'),
  },
  [RouteConstants.ROUTE_EXTRAS]: {
    iconOn: IconExtra2,
    iconOff: IconExtra1,
    label: t('toolbar.extras'),
  },
  [RouteConstants.ROUTE_SETTINGS]: {
    iconOn: IconSettings2,
    iconOff: IconSettings1,
    label: t('toolbar.settings'),
  },
}

const isSelected = computed(() => appStore.activePage === props.route)

const icon = computed(() => {
  let isActiveKey = isSelected.value ? 'iconOn' : 'iconOff'
  return icons[props.route][isActiveKey]
})

const label = computed(() => {
  return icons[props.route]?.label
})
</script>
