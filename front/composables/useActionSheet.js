import { ref, h, render } from 'vue'
// import { ActionSheet } from 'vant'
import AppActionSheet from '~/components/ui-kit/app-action-sheet.vue'
import 'vant/lib/action-sheet/index.css'

export function useActionSheet() {
  const isVisible = ref(false)
  const actions = ref([])
  let container = null
  let actionSheet = null

  const show = (newActions) => {
    actions.value = newActions

    if (!actionSheet) {
      initContainer()
      renderActionSheet()
    }

    isVisible.value = true
  }

  const initContainer = () => {
    container = document.createElement('div')
    document.body.appendChild(container)
  }

  const renderActionSheet = () => {
    actionSheet = h(AppActionSheet, {
      show: isVisible.value,
      'onUpdate:show': (newValue) => {
        isVisible.value = newValue
      },
      actions: actions.value,
    }, {
      action: ({ action, index }) => h('div', `${action.name}`)
    })

    render(actionSheet, container)
  }

  watch(isVisible, (newValue) => {
    renderActionSheet()
  })

  return {
    show,
  }
}
