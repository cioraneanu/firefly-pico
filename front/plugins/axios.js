import axios from 'axios'
import { get } from 'lodash-es'
import { IconSettings } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import { demoAdapter } from '~/core/demo/DemoBackend.js'

axios.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()
    const loadingStore = useLoadingStore()

    const controller = new AbortController()
    const requestId = Math.random().toString(36).substring(7)
    config.requestId = requestId
    config.signal = controller.signal
    config.showLoading = config.showLoading !== false
    config.showLoading && loadingStore.addActiveRequest({ id: requestId, controller })

    const { authToken, picoBackendHeaders } = config.connection ?? appStore
    if (!authToken) {
      showNoTokenToast()
      controller.abort()
    }

    picoBackendHeaders?.forEach(({ key, value }) => {
      if (key?.trim()) {
        config.headers[key.trim()] = value
      }
    })
    config.headers['Authorization'] = `Bearer ${authToken}`
    config.timeout = config.timeout || appStore.queryTimeout
    if (config.connection?.isDemoMode ?? appStore.isDemoMode) config.adapter = demoAdapter
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// One toast for the burst of requests a page fires without a token, with a shortcut to Setup (token or demo mode)
let noTokenToast = null
const showNoTokenToast = () => {
  if (noTokenToast) return
  const { t } = useNuxtApp().$i18n
  const action = { label: t('settings.setup_entry'), icon: IconSettings, onClick: () => navigateTo(RouteConstants.ROUTE_SETTINGS_SETUP) }
  noTokenToast = UIUtils.showToast(t('settings.setup.no_token'), 'danger', 6000, { action, onClose: () => (noTokenToast = null) })
}

const MAX_RETRIES = 1

const retryRequest = async (error) => {
  let errorMessage = get(error, 'response.data.message') ?? get(error, 'message') ?? ''

  const isTimeout = error.code === 'ECONNABORTED' || errorMessage.includes('timeout') || errorMessage.includes('Failed to connect to')
  const config = error.config
  // Only reads are retried: a write that timed out may still have gone through, a retry would repeat it
  if (!isTimeout || config?.method !== 'get') {
    return
  }

  if (!config?.retry) {
    config.retry = 0
  }

  // Check if we should retry (timeout or network error)
  // console.log('isTimeout', { isTimeout, error })

  if (config.retry >= MAX_RETRIES) {
    return
  }

  config.retry += 1
  const delay = 1000 * Math.pow(2, config.retry - 1)
  // console.log(`Retrying request (${config.retry}/${MAX_RETRIES}) after ${delay}ms`)

  // Wait before retrying
  await sleep(delay)

  // Return the new axios request
  return axios(config)
}

axios.interceptors.response.use(
  function (response) {
    const loadingStore = useLoadingStore()
    response.config?.showLoading && loadingStore.removeActiveRequest(response.config?.requestId)

    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response
  },
  async function (error) {
    let errorMessage = get(error, 'response.data.message') ?? get(error, 'message')
    // Requests cancelled on purpose (no token, leaving the page) need no toast
    let showErrorToast = error.config?.showErrorToast !== false && !axios.isCancel(error)
    errorMessage && showErrorToast && UIUtils.showToastError(`Error: ${errorMessage}`, 4000)

    // The retry gets its own requestId on the same config: remember this one first
    const requestId = error.config?.requestId
    const retryResponse = await retryRequest(error)

    const loadingStore = useLoadingStore()
    error.config?.showLoading && loadingStore.removeActiveRequest(requestId)
    return Promise.resolve(retryResponse ?? error.response)
  },
)

export default defineNuxtPlugin(() => {})
