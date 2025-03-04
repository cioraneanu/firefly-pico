import axios from 'axios'
import { useProfileStore } from '~/stores/profileStore'
import { get } from 'lodash'

axios.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()

    const controller = new AbortController()

    let authToken = appStore.authToken
    if (!appStore.hasAuthToken) {
      const router = useRouter()
      UIUtils.showToastError('No personal access token...')
      controller.abort()
    }

    config.headers['Authorization'] = `Bearer ${authToken}`
    config.timeout = appStore.queryTimeout
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

const MAX_RETRIES = 2

const retryRequest = async (error) => {
  const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Failed to connect to')
  if (!isTimeout) {
    return
  }

  const config = error.config
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
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response
  },
  async function (error) {
    let errorMessage = get(error, 'response.data.message') ?? get(error, 'message')

    if (errorMessage) {
      UIUtils.showToastError(`Error: ${errorMessage}`, 4000)
    }

    await retryRequest(error)

    return Promise.resolve(error.response)
  },
)

export default defineNuxtPlugin((nuxtApp) => {})
