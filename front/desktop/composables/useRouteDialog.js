export function useRouteDialog(listRoute) {
  const route = useRoute()
  const id = computed(() => route.params.id)
  const isOpen = computed(() => id.value !== 'list')
  const close = () => navigateTo(listRoute)

  return { id, isOpen, close }
}
