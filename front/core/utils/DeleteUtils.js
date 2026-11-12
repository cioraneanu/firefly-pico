import UIUtils from '~/core/utils/UIUtils'

// Items whose delete waits behind an Undo toast (or already ran). Lists hide them, so Undo needs no API call.
const deletedKeys = reactive(new Set())
const keyOf = (item) => `${item?.type}:${item?.id}`
const pendingToasts = new Set()

export const withoutDeleted = (list) => (deletedKeys.size ? (list ?? []).filter((item) => !deletedKeys.has(keyOf(item))) : list)

// Leaving the app (tab hidden, phone locked) runs the waiting deletes right away instead of losing them
document.addEventListener('visibilitychange', () => document.hidden && pendingToasts.forEach((toast) => toast.close()))

// Asks "Are you sure?" or, with profileStore.undoDelete (the default), hides the item at once and shows an Undo toast:
// the request runs once the toast is gone. `leave` runs when the item goes away (a form goes back to its list);
// `undoable: false` keeps the dialog for items no list can hide (profiles).
// Resolves with the delete response, or null when cancelled or undone.
export async function deleteWithUndo(item, request, { leave = null, undoable = true } = {}) {
  const { t } = useNuxtApp().$i18n

  if (!useProfileStore().undoDelete || !undoable) {
    if (!(await UIUtils.showDeleteConfirmation('Delete confirmation', 'Are you sure you want to delete this?'))) return null
    const response = await request()
    if (ResponseUtils.isSuccess(response)) {
      await leave?.()
      UIUtils.showToastSuccess('Deleted successfully.', 1000)
    }
    return response
  }

  const key = keyOf(item)
  deletedKeys.add(key)
  leave?.()

  let isUndone = false
  await new Promise((resolve) => {
    const toast = UIUtils.showToast(t('deleted'), 'success', 5000, {
      action: { label: t('undo'), onClick: () => (isUndone = true) },
      onClose: () => {
        pendingToasts.delete(toast)
        resolve()
      },
    })
    pendingToasts.add(toast)
  })

  const response = isUndone ? null : await request()
  if (!ResponseUtils.isSuccess(response)) deletedKeys.delete(key)
  return response
}
