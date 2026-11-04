import { isDesktopUI } from '~/core/utils/UIModeUtils'
import desktopRoutes from '~/desktop/routes'

export default {
  routes: (routes) => (isDesktopUI ? desktopRoutes : routes),
}
