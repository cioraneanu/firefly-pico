import { IconBasket, IconBuildingBank, IconCategory, IconPigMoney, IconPlus, IconSearch, IconSparkles, IconTag, IconTemplate } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Budget from '~/core/models/Budget'
import Category from '~/core/models/Category'
import PiggyBank from '~/core/models/PiggyBank'
import Tag from '~/core/models/Tag'
import TransactionTemplate from '~/core/models/TransactionTemplate'
import { withoutDeleted } from '~/core/utils/DeleteUtils'

// Module-level so the sidebar can open it without building the item list.
// ⌘K on macOS (Ctrl K is "kill line" in its inputs), Ctrl K elsewhere.
const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
export const isCommandPaletteOpen = ref(false)
export const commandPaletteShortcut = isMac ? '⌘K' : 'Ctrl K'
export const isCommandPaletteKey = (event) => (isMac ? event.metaKey : event.ctrlKey) && event.key?.toLowerCase() === 'k'

// ⌘K palette: jump to a page, create something, open an account / category / tag / ... by name,
// or turn the typed text into a new transaction (through the assistant) or a transactions search
export function useCommandPalette(query = ref('')) {
  const { t } = useI18n()
  const profileStore = useProfileStore()
  const { groups } = useDesktopNav()

  const resource = (isEnabled, label, list, model, route, icon) =>
    isEnabled
      ? withoutDeleted(list)
          .map((item) => ({ group: label, label: model.getDisplayName(item), icon: model.getIcon(item) ?? icon, to: `${route}/${item.id}` }))
          .filter((item) => LanguageUtils.includesSearch(item.label, query.value.trim()))
          .slice(0, 4)
      : []

  const items = computed(() => {
    const text = query.value.trim()
    const matches = (item) => LanguageUtils.includesSearch(item.label, text)

    const pages = groups.value.flatMap((group) => group.items).map((item) => ({ group: t('desktop.command.pages'), label: item.label, icon: item.icon, to: item.to }))
    const create = [
      { label: t('new_transaction'), icon: IconPlus, to: RouteConstants.ROUTE_TRANSACTION_ID, kbd: 'N' },
      { label: t('account_page.title_add'), icon: IconBuildingBank, to: RouteConstants.ROUTE_ACCOUNT_ID },
      profileStore.categoriesEnabled && { label: t('category_page.title_add'), icon: IconCategory, to: RouteConstants.ROUTE_CATEGORY_ID },
      profileStore.tagsEnabled && { label: t('tag_page.title_add'), icon: IconTag, to: RouteConstants.ROUTE_TAG_ID },
      profileStore.budgetsEnabled && { label: t('budget_page.title_add'), icon: IconBasket, to: RouteConstants.ROUTE_BUDGET_ID },
      profileStore.piggyBanksEnabled && { label: t('piggy_bank_page.title_add'), icon: IconPigMoney, to: RouteConstants.ROUTE_PIGGY_BANK_ID },
      { label: t('transaction_template_page.title_add'), icon: IconTemplate, to: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID },
    ]
      .filter(Boolean)
      .map((item) => ({ group: t('desktop.command.create'), ...item }))

    const entities = !text
      ? []
      : [
          ...resource(true, t('accounts'), useAccountStore().accountList, Account, RouteConstants.ROUTE_ACCOUNT_ID, IconBuildingBank),
          ...resource(profileStore.categoriesEnabled, t('categories'), useCategoryStore().categoryList, Category, RouteConstants.ROUTE_CATEGORY_ID, IconCategory),
          ...resource(profileStore.tagsEnabled, t('tags'), useTagStore().tagList, Tag, RouteConstants.ROUTE_TAG_ID, IconTag),
          ...resource(profileStore.budgetsEnabled, t('budgets'), useBudgetStore().budgetList, Budget, RouteConstants.ROUTE_BUDGET_ID, IconBasket),
          ...resource(profileStore.piggyBanksEnabled, t('piggy_banks'), usePiggyBankStore().piggyBankList, PiggyBank, RouteConstants.ROUTE_PIGGY_BANK_ID, IconPigMoney),
          ...resource(true, t('templates'), useTemplateStore().transactionTemplateList, TransactionTemplate, RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID, IconTemplate),
        ]

    const fromText = !text
      ? []
      : [
          { label: t('desktop.command.add_transaction', { text }), icon: IconSparkles, to: `${RouteConstants.ROUTE_TRANSACTION_ID}?assistant=${encodeURIComponent(text)}` },
          { label: t('desktop.command.search_transactions', { text }), icon: IconSearch, to: `${RouteConstants.ROUTE_TRANSACTION_LIST}?description=${encodeURIComponent(text)}` },
        ].map((item) => ({ group: t('desktop.command.actions'), ...item }))

    return [...[...pages, ...create].filter(matches), ...entities, ...fromText]
  })

  return { items }
}
