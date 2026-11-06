import { get } from 'lodash-es'
import UserRepository from '~/core/repository/UserRepository'

export function useConnectionTest() {
  const { t } = useI18n()
  const isTesting = ref(false)

  const testConnection = async ({ picoBackendURL, authToken, picoBackendHeaders }) => {
    isTesting.value = true
    const connection = { picoBackendURL: picoBackendURL.replace(/\/$/, ''), authToken: authToken.trim().replace(/^Bearer\s+/i, ''), picoBackendHeaders }
    const response = await new UserRepository().getUser(connection)
    isTesting.value = false
    if (!ResponseUtils.isSuccess(response)) return UIUtils.showToastError(t('settings.setup.invalid_endpoint'))
    if (!get(response, 'data.data.id')) return UIUtils.showToastError(t('settings.setup.invalid_token'))
    UIUtils.showToastSuccess(t('settings.setup.connection_successful'))
  }

  return { testConnection, isTesting }
}
