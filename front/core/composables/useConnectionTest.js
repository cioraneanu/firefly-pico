import { get } from 'lodash-es'
import UserRepository from '~/core/repository/UserRepository'
import { exitDemo } from '~/core/demo/DemoBackend.js'

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

  // Back to a fresh install (same reset as leaving demo mode), so the token can be replaced or demo mode tried
  const disconnect = async () => (await UIUtils.showDeleteConfirmation(t('settings.setup.disconnect'), t('settings.setup.disconnect_confirm'))) && exitDemo()

  return { testConnection, isTesting, disconnect }
}
