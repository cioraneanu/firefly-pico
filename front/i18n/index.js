// import { flags } from '~/constants/SvgConstants.js'

export const languageCode = {
  en: 'en',
  ro: 'ro',
  zhCn: 'zh-CN'
}

export const supportedLanguages = [
  {
    code: languageCode.en,
    file: 'en.json',
    displayName: 'English',
    icon: 'svgo-flags-en',
  },
  {
    code: languageCode.ro,
    file: 'ro.json',
    displayName: 'Română',
    icon: 'svgo-flags-ro',
  },
  {
    code: languageCode.zhCn,
    file: 'zh-CN.json',
    displayName: '简体中文',
    icon: 'svgo-flags-cn',

    // icon: flags.ro,
  },
]
