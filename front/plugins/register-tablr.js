import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconArrowDown,
  IconCalendarEvent,
  IconCarambola,
  IconCategory,
  IconCoin,
  IconCoins,
  IconCreditCard,
  IconDelta,
  IconDeviceDesktopAnalytics,
  IconEye,
  IconEyeX,
  IconGridDots,
  IconHash,
  IconInfoSquare,
  IconLetterCase,
  IconList,
  IconMenu2,
  IconMoodCog,
  IconNotes,
  IconRefresh,
  IconRuler,
  IconSettings,
  IconSquareRoundedMinus,
  IconSquareRoundedPlus,
  IconTag,
  IconTemplate,
  IconTool,
  IconTransfer,
  IconReplace,
  IconCodeCircle,
  IconSquareRounded,
  IconSquareRoundedCheck,
  IconMoon,
  IconSun,
  IconExternalLink,
  IconCash,
  IconCashBanknote,
} from '@tabler/icons-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('IconMoon', IconMoon)
  nuxtApp.vueApp.component('IconSun', IconSun)
  nuxtApp.vueApp.component('IconSquareRoundedCheck', IconSquareRoundedCheck)
  nuxtApp.vueApp.component('IconSquareRounded', IconSquareRounded)
  nuxtApp.vueApp.component('IconCodeCircle', IconCodeCircle)
  nuxtApp.vueApp.component('IconReplace', IconReplace)
  nuxtApp.vueApp.component('IconCarambola', IconCarambola)
  nuxtApp.vueApp.component('IconDelta', IconDelta)
  nuxtApp.vueApp.component('IconHash', IconHash)
  nuxtApp.vueApp.component('IconTransfer', IconTransfer)
  nuxtApp.vueApp.component('IconArrowLeft', IconArrowLeft)
  nuxtApp.vueApp.component('IconArrowUp', IconArrowUp)
  nuxtApp.vueApp.component('IconArrowDown', IconArrowDown)
  nuxtApp.vueApp.component('IconArrowRight', IconArrowRight)
  nuxtApp.vueApp.component('IconNotes', IconNotes)
  nuxtApp.vueApp.component('IconLetterCase', IconLetterCase)
  nuxtApp.vueApp.component('IconCreditCard', IconCreditCard)
  nuxtApp.vueApp.component('IconDeviceDesktopAnalytics', IconDeviceDesktopAnalytics)
  nuxtApp.vueApp.component('IconCoins', IconCoins)
  nuxtApp.vueApp.component('IconRefresh', IconRefresh)
  nuxtApp.vueApp.component('IconCategory', IconCategory)
  nuxtApp.vueApp.component('IconCoin', IconCoin)
  nuxtApp.vueApp.component('IconInfoSquare', IconInfoSquare)
  nuxtApp.vueApp.component('IconList', IconList)
  nuxtApp.vueApp.component('IconGridDots', IconGridDots)
  nuxtApp.vueApp.component('IconMenu2', IconMenu2)
  nuxtApp.vueApp.component('IconMoodCog', IconMoodCog)
  nuxtApp.vueApp.component('IconRuler', IconRuler)
  nuxtApp.vueApp.component('IconSettings', IconSettings)
  nuxtApp.vueApp.component('IconTag', IconTag)
  nuxtApp.vueApp.component('IconTemplate', IconTemplate)
  nuxtApp.vueApp.component('IconTool', IconTool)
  nuxtApp.vueApp.component('IconEye', IconEye)
  nuxtApp.vueApp.component('IconEyeX', IconEyeX)
  nuxtApp.vueApp.component('IconCalendarEvent', IconCalendarEvent)
  nuxtApp.vueApp.component('IconSquareRoundedMinus', IconSquareRoundedMinus)
  nuxtApp.vueApp.component('IconSquareRoundedPlus', IconSquareRoundedPlus)
  nuxtApp.vueApp.component('IconExternalLink', IconExternalLink)
  nuxtApp.vueApp.component('IconCash', IconCash)
  nuxtApp.vueApp.component('IconCashBanknote', IconCashBanknote)

  // for (let iconName in tablerIcons) {
  //   nuxtApp.vueApp.component(iconName, tablerIcons[iconName])
  // }

  // nuxtApp.vueApp.component('IconDeviceDesktopAnalytics', allIcons.IconDeviceDesktopAnalytics)

  // const myIcon = 'IconDeviceDesktopAnalytics'
  // const component = () => import(`@tabler/icons-vue/${myIcon}`)
  // const component = require.context('@tabler/icons-vue', true, /\.vue$/)('./' + myIcon + '.vue')
  // nuxtApp.vueApp.component(myIcon, component)
  //
  // const MyComponent = async () => {
  //   // Dynamic import based on component name
  //   const component = await import(`@tabler/icons-vue`)
  //   return component[myIcon]
  // }
  //
  // const pls = defineAsyncComponent(() => import('@tabler/icons-vue').then(m => m[myIcon]))
  //
  // const testComponent = () => import('@tabler/icons-vue').then(m => {
  //   const result = m[myIcon]
  //   return result
  // })
  //
  // nuxtApp.vueApp.component(myIcon, pls)
})
