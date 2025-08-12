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
  IconFavicon,
  IconArticle,
  IconSelector,
  IconBlockquote,
  IconWriting,
  IconKey,
  IconToggleLeftFilled,
  IconListTree,
  IconSquareRoundedArrowDown,
  IconGridPattern,
  IconPercentage30,
  IconMoneybag,
  IconBasket,
  IconCopy,
  IconLock,
  IconMessageChatbot,
  IconAdjustmentsAlt,
  IconFilter,
  IconForms,
  IconMenuOrder,
  IconBusinessplan,
  IconCalendarDollar,
  IconListDetails,
  IconCloudDown,
  IconPhoto,
  IconFilter2
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
  nuxtApp.vueApp.component('IconFavicon', IconFavicon)
  nuxtApp.vueApp.component('IconArticle', IconArticle)
  nuxtApp.vueApp.component('IconSelector', IconSelector)
  nuxtApp.vueApp.component('IconBlockquote', IconBlockquote)
  nuxtApp.vueApp.component('IconWriting', IconWriting)
  nuxtApp.vueApp.component('IconKey', IconKey)
  nuxtApp.vueApp.component('IconToggleLeftFilled', IconToggleLeftFilled)
  nuxtApp.vueApp.component('IconListTree', IconListTree)
  nuxtApp.vueApp.component('IconGridPattern', IconGridPattern)
  nuxtApp.vueApp.component('IconPercentage30', IconPercentage30)
  nuxtApp.vueApp.component('IconBasket', IconBasket)
  nuxtApp.vueApp.component('IconCopy', IconCopy)
  nuxtApp.vueApp.component('IconLock', IconLock)
  nuxtApp.vueApp.component('IconMessageChatbot', IconMessageChatbot)
  nuxtApp.vueApp.component('IconAdjustmentsAlt', IconAdjustmentsAlt)
  nuxtApp.vueApp.component('IconFilter', IconFilter)
  nuxtApp.vueApp.component('IconForms', IconForms)
  nuxtApp.vueApp.component('IconMenuOrder', IconMenuOrder)
  nuxtApp.vueApp.component('IconBusinessplan', IconBusinessplan)
  nuxtApp.vueApp.component('IconCalendarDollar', IconCalendarDollar)
  nuxtApp.vueApp.component('IconListDetails', IconListDetails)
  nuxtApp.vueApp.component('IconCloudDown', IconCloudDown)
  nuxtApp.vueApp.component('IconPhoto', IconPhoto)
  nuxtApp.vueApp.component('IconFilter2', IconFilter2)

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
