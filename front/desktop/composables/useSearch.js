export function useSearch(list, ...getters) {
  const search = ref('')
  const filtered = computed(() => toValue(list).filter((item) => getters.some((get) => LanguageUtils.includesSearch(String(get(item) ?? ''), search.value))))

  return { search, filtered }
}
