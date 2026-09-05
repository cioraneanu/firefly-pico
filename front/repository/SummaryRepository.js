import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository'

export default class SummaryRepository extends BaseRepository {
  constructor() {
    super('api/summary')
  }

  async getBasic({ start, end, showLoading = false, timeout = undefined } = {}) {
    const params = new URLSearchParams()
    params.append('start', start)
    params.append('end', end)
    // No currency_code param — omitting it returns one entry per currency present, which we
    // read via each entry's own currency_code field and convert ourselves at READ time
    // (sumConverted), matching every other money value in analyticsStore. We only ever read
    // net-worth-in-* entries from this response (see analyticsStore.fetchNetWorthMonth) —
    // balance/spent/earned/bills-*/left-to-spend are all period-flow figures, confirmed against
    // a real instance, and are NOT stock snapshots usable here.
    const response = await axios.get(`${this.getUrl()}/basic?${params.toString()}`, { showLoading, timeout })
    return get(response, 'data', {})
  }
}
