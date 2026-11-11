import { ref } from 'vue'

// The action sheet of the mobile app. State lives at module level and <app-feedback-host> renders it
// inside the .mx root, so any component can open it: useActionSheet().show([{ name, callback }], title?)
const isVisible = ref(false)
const actions = ref([])
const title = ref(null)

export function useActionSheet() {
  const show = (newActions, newTitle = null) => {
    actions.value = newActions
    title.value = newTitle
    isVisible.value = true
  }

  return { show, isVisible, actions, title }
}
