import axios from 'axios'
import { useProfileStore } from '~/stores/profileStore'
import { get } from 'lodash'

axios.interceptors.request.use(
  (config) => {
    const profileStore = useProfileStore()

    const controller = new AbortController()

    let authToken = profileStore.authToken
    if (!profileStore.hasAuthToken) {
      const router = useRouter()
      UIUtils.showToastError('No personal access token...')
      // router.push(RouteConstants.ROUTE_SETTINGS_APP_CONFIG).then(r => {})
      controller.abort()
    }

    config.headers['Authorization'] = `Bearer ${authToken}`
    config.timeout = profileStore.queryTimeout
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response
  },
  function (error) {
    let errorMessage = get(error, 'response.data.message') ?? get(error, 'message')

    if (errorMessage) {
      UIUtils.showToastError(`Error: ${errorMessage}`, 4000)
    }
    // return Promise.reject(error)
    return Promise.resolve(error.response)
  },
)

export default defineNuxtPlugin((nuxtApp) => {})
