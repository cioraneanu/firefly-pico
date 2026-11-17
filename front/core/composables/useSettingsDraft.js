import { cloneDeep, get, set } from 'lodash-es'

export function useSettingsDraft(paths, { onSaved } = {}) {
  const { t } = useI18n()
  const profileStore = useProfileStore()
  const draft = reactive({})
  const isSaving = ref(false)

  const reset = () => paths.forEach((path) => (draft[path] = cloneDeep(get(profileStore, path))))

  const save = async () => {
    isSaving.value = true
    paths.forEach((path) => set(profileStore, path, cloneDeep(draft[path])))
    const response = await profileStore.writeProfile()
    if (!response || ResponseUtils.isSuccess(response)) {
      // onSaved returns false when it failed (and showed its own error)
      if ((await onSaved?.()) !== false) {
        UIUtils.showToastSuccess(t('settings.settings_saved'))
      }
    }
    isSaving.value = false
  }

  watch(() => paths.map((path) => get(profileStore, path)), reset, { immediate: true, deep: true })

  return { draft, save, reset, isSaving }
}
