import { ref, h } from 'vue'
import { ActionSheet } from 'vant'
import { createApp } from 'vue'

export function useActionSheet() {
  const isVisible = ref(false)
  const actions = ref([])
  let actionSheetInstance = null

  const show = (newActions) => {
    actions.value = newActions
    isVisible.value = true

    if (!actionSheetInstance) {
      const app = createApp({
        setup() {
          return () =>
            h(ActionSheet, {
              show: isVisible.value,
              actions: actions.value,
              onSelect: (action) => {
                if (action.callback) action.callback()
                isVisible.value = false
              },
              onCancel: () => {
                isVisible.value = false
              },
            })
        },
      })

      const container = document.createElement('div')
      document.body.appendChild(container)
      actionSheetInstance = app.mount(container)
    }
  }

  return {
    show,
  }
}
