// import { flags } from '~/constants/SvgConstants.js'

export const languageCode = {
  english: 'en',
  romanian: 'ro',
  chinese: 'zh-CN',
  italian: 'it'
}

export const supportedLanguages = [
  {
    code: languageCode.english,
    file: 'en.json',
    displayName: 'English',
    icon: 'svgo-flags-en',
  },
  {
    code: languageCode.romanian,
    file: 'ro.json',
    displayName: 'Română',
    icon: 'svgo-flags-ro',
  },
  {
    code: languageCode.chinese,
    file: 'zh-CN.json',
    displayName: '简体中文',
    icon: 'svgo-flags-cn',
  },
  {
    code: languageCode.italian,
    file: 'it.json',
    displayName: 'Italiano',
    icon: 'svgo-flags-it',
  },
]
