import { IconDeviceDesktopAnalytics, IconForms, IconInfoSquare, IconListDetails, IconMessageChatbot, IconPalette, IconServer } from '@tabler/icons-vue'

export default [
  { code: 'connection', t: 'desktop.settings_connection', icon: IconServer, component: () => import('./components/settings/settings-connection.vue') },
  { code: 'appearance', t: 'desktop.settings_appearance', icon: IconPalette, component: () => import('./components/settings/settings-appearance.vue') },
  { code: 'dashboard', t: 'settings.dashboard_entry', icon: IconDeviceDesktopAnalytics, component: () => import('./components/settings/settings-dashboard.vue') },
  { code: 'transaction-fields', t: 'desktop.settings_fields', icon: IconForms, component: () => import('./components/settings/settings-fields.vue') },
  { code: 'transaction-defaults', t: 'desktop.settings_defaults', icon: IconListDetails, component: () => import('./components/settings/settings-defaults.vue') },
  { code: 'assistant', t: 'settings.assistant_entry', icon: IconMessageChatbot, component: () => import('./components/settings/settings-assistant.vue') },
  { code: 'about', t: 'settings.about_entry', icon: IconInfoSquare, component: () => import('./components/settings/settings-about.vue') },
]
