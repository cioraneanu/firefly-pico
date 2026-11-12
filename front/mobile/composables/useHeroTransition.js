// Transaction row → transaction page: the tapped row grows into the page (View Transitions API). The pages opt in with
// definePageMeta({ viewTransition: true }); the row and the page share the 'mx-hero' name only for the transaction that was opened.
const heroId = ref(null)

export function useHeroTransition() {
  const heroStyle = (id) => (id && String(id) === String(heroId.value) ? { viewTransitionName: 'mx-hero' } : null)

  // Names the row (after a render) before `open` navigates
  const openWithHero = async (id, open) => {
    heroId.value = id
    await nextTick()
    return open()
  }

  return { heroStyle, openWithHero }
}
