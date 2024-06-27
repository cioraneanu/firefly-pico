import { set, get } from 'lodash'
import { watch } from 'vue'

export function saveSettingsToStore(settingsList) {
  for (let setting of settingsList) {
    let { store, path, ref } = setting
    set(store, path, ref.value)
  }
}

export function saveSettingsToLocal(settingsList) {
  for (let setting of settingsList) {
    let { store, path, ref } = setting
    ref.value = get(store, path)
  }
}

export function watchSettingsStore(settingsList) {
  let watchList = () =>
    settingsList.reduce((result, setting) => {
      let { store, path, ref } = setting
      result = [...result, get(store, path)]
      return result
    }, [])

  watch(watchList, () => saveSettingsToLocal(settingsList), { immediate: true })
}
