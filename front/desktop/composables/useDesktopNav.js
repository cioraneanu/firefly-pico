import {
  IconBasket,
  IconBuildingBank,
  IconCalendarRepeat,
  IconCategory,
  IconCoin,
  IconCoins,
  IconLayoutDashboard,
  IconListCheck,
  IconPigMoney,
  IconReplace,
  IconSettings,
  IconTag,
  IconTemplate,
} from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

export function useDesktopNav() {
  const { t } = useI18n()
  const route = useRoute()
  const profileStore = useProfileStore()
  const todoStore = useTodoStore()

  const groups = computed(() =>
    [
      {
        label: t('desktop.nav.overview'),
        items: [
          { label: t('dashboard.title'), icon: IconLayoutDashboard, to: RouteConstants.ROUTE_DASHBOARD },
          { label: t('toolbar.transactions'), icon: IconCoins, to: RouteConstants.ROUTE_TRANSACTION_LIST },
          { label: t('accounts'), icon: IconBuildingBank, to: RouteConstants.ROUTE_ACCOUNT_LIST },
          { label: t('todo_page.title'), icon: IconListCheck, to: RouteConstants.ROUTE_TODO, count: todoStore.visibleTodoList.length, hidden: !profileStore.tagsEnabled },
        ],
      },
      {
        label: t('classifications'),
        items: [
          { label: t('categories'), icon: IconCategory, to: RouteConstants.ROUTE_CATEGORY_LIST, hidden: !profileStore.categoriesEnabled },
          { label: t('tags'), icon: IconTag, to: RouteConstants.ROUTE_TAG_LIST, hidden: !profileStore.tagsEnabled },
        ],
      },
      {
        label: t('desktop.nav.planning'),
        items: [
          { label: t('budgets'), icon: IconBasket, to: RouteConstants.ROUTE_BUDGET_LIST, hidden: !profileStore.budgetsEnabled },
          { label: t('piggy_banks'), icon: IconPigMoney, to: RouteConstants.ROUTE_PIGGY_BANK_LIST, hidden: !profileStore.piggyBanksEnabled },
          { label: t('recurring_transactions'), icon: IconCalendarRepeat, to: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST, hidden: !profileStore.recurringTransactionsEnabled },
          { label: t('templates'), icon: IconTemplate, to: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST },
        ],
      },
      {
        label: t('desktop.nav.reference'),
        items: [
          { label: t('currencies'), icon: IconCoin, to: RouteConstants.ROUTE_CURRENCY_LIST },
          { label: t('exchange_rates'), icon: IconReplace, to: RouteConstants.ROUTE_EXCHANGE_RATES },
          { label: t('toolbar.settings'), icon: IconSettings, to: RouteConstants.ROUTE_SETTINGS },
        ],
      },
    ]
      .map((group) => ({ ...group, items: group.items.filter((item) => !item.hidden) }))
      .filter((group) => group.items.length),
  )

  const section = (path) => path.split('/')[1]
  const active = computed(() => groups.value.flatMap((group) => group.items).find((item) => section(item.to) === section(route.path)))

  return { groups, active }
}
