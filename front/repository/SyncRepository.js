import axios from 'axios'
import { get } from 'lodash-es'

export default class SyncRepository {
  getUrl() {
    return `${useAppStore().picoBackendURL}/api/sync`
  }

  async sync({ entities = [], params = {}, hash = null, force = false, showLoading = true } = {}) {
    const response = await axios.get(this.getUrl(), {
      params: { entities: entities.join(','), ...params, ...(hash ? { hash } : {}), ...(force ? { force: 1 } : {}) },
      showLoading,
      showErrorToast: showLoading,
      timeout: 90000,
    })

    return get(response, 'data', {})
  }
}
