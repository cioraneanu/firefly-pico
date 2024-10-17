import { ref, h, render } from 'vue'
import { ActionSheet } from 'vant'
import 'vant/lib/action-sheet/index.css'

export function useActionSheet() {
  const isVisible = ref(false)
  const actions = ref([])
  let container = null
  let actionSheet = null

  const show = (newActions) => {
    actions.value = newActions

    if (!actionSheet) {
      container = document.createElement('div')
      document.body.appendChild(container)

      watchEffect(() => {
        console.log('watchEffect')
        actionSheet = h(ActionSheet, {
          show: isVisible.value,
          'onUpdate:show': (newValue) => {
            isVisible.value = newValue
          },
          cancelText: "Cancel",
          actions: actions.value,
          onSelect: (action) => {
            if (action.callback) action.callback()
            // isVisible.value = false
          },
          // onCancel: () => {
          //   isVisible.value = false
          // },
        })

        render(actionSheet, container)
      })
    }

    isVisible.value = true
  }

  return {
    show,
  }
}
