import axios from 'axios'
import { useAppStore } from '~/stores/appStore'
import _ from 'lodash'
import RouteConstants from '~/constants/RouteConstants'

axios.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()

    const controller = new AbortController()

    let authToken = appStore.authToken
    if (!appStore.hasAuthToken) {
      const router = useRouter()
      UIUtils.showToastError('No personal access token...')
      // router.push(RouteConstants.ROUTE_SETTINGS_APP_CONFIG).then(r => {})
      controller.abort()
    }

    config.headers['Authorization'] = `Bearer ${authToken}`
    config.timeout = 4000
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
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    let errorMessage = _.get(error, 'response.data.message')

    if (errorMessage) {
      UIUtils.showToastError(`Error: ${errorMessage}`, 4000)
    }
    // return Promise.reject(error)
    return Promise.resolve(error.response)
  },
)

export default defineNuxtPlugin((nuxtApp) => {})
