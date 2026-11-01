import { avatarListIcons, duoToneListIcons, fluentListIcons } from '~/core/constants/SvgConstants.js'
import Icon from '~/core/models/Icon.js'

const PAGE_SIZE = 60

export function useIconPicker(model, defaultTab = 'classic') {
  const { t } = useI18n()
  const iconStore = useIconStore()

  const search = ref('')
  const activeTab = ref(defaultTab)
  const visibleCount = ref(PAGE_SIZE)

  const tabs = computed(() => [
    { value: 'classic', label: t('icon_select_classic'), list: [...duoToneListIcons, ...fluentListIcons] },
    { value: 'avatars', label: t('icon_select_avatars'), list: avatarListIcons },
    ...(iconStore.customIconList.length > 0 ? [{ value: 'custom', label: t('icon_select_custom'), list: iconStore.customIconList }] : []),
  ])

  const filteredList = computed(() => (tabs.value.find((tab) => tab.value === activeTab.value)?.list ?? []).filter((icon) => LanguageUtils.includesSearch(icon.name, search.value)))
  const visibleList = computed(() => filteredList.value.slice(0, visibleCount.value))
  const isFinished = computed(() => visibleCount.value >= filteredList.value.length)

  const loadMore = () => (visibleCount.value += PAGE_SIZE)

  const getTabForIcon = (icon) => {
    if (Icon.isTypeCustom(icon)) return 'custom'
    if (Icon.isTypeAvatar(icon)) return 'avatars'
    return icon ? 'classic' : defaultTab
  }

  const onOpen = () => {
    activeTab.value = getTabForIcon(model.value?.icon)
    iconStore.fetchCustomIcons()
  }

  watch([activeTab, search], () => (visibleCount.value = PAGE_SIZE))

  return { search, activeTab, tabs, filteredList, visibleList, isFinished, loadMore, onOpen }
}
