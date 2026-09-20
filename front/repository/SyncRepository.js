import axios from 'axios'
import { get } from 'lodash-es'

export default class SyncRepository {
  getUrl() {
    return `${useAppStore().picoBackendURL}/api/sync`
  }

  /**
   * Fetches every reference resource in one request.
   *
   * Passing the hash we already hold lets the backend answer "nothing changed" without
   * sending the payload again, which is what makes syncing on every app focus affordable.
   */
  async sync({ entities = [], params = {}, hash = null, showLoading = true } = {}) {
    const response = await axios.get(this.getUrl(), {
      params: { entities: entities.join(','), ...params, ...(hash ? { hash } : {}) },
      showLoading,
    })

    return get(response, 'data', {})
  }
}
