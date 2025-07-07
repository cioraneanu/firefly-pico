import BaseModel from '~/models/BaseModel'
import { avatarListIcons, duoToneListIcons, fluentListIcons } from '~/constants/SvgConstants.js'

export default class Icon extends BaseModel {
  // ------------

  static getIcon(iconName) {
    if (!iconName) {
      return null
    }

    let iconsList = []
    // if (iconName.startsWith('svgo-flat')) {
    //   iconsList = flatColorListIcons
    // }
    if (this.isTypeDuo(iconName)) {
      iconsList = duoToneListIcons
    }
    if (this.isTypeFluent(iconName)) {
      iconsList = fluentListIcons
    }
    if (this.isTypeAvatar(iconName)) {
      iconsList = avatarListIcons
    }
    // if (iconName.startsWith('Icon')) {
    //   iconsList = appSelectIcons
    // }
    return iconsList.find((item) => item.icon === iconName)
  }

  static isTypeAvatar(iconName) {
    return iconName?.startsWith('svgo-avatar')
  }

  static isTypeFlag(iconName) {
    return iconName?.startsWith('svgo-flags')
  }

  static isTypeDuo(iconName) {
    return iconName?.startsWith('svgo-duo')
  }

  static isTypeFluent(iconName) {
    return iconName?.startsWith('svgo-fluent')
  }

  static isTypeTabler(iconName) {
    return iconName?.startsWith('Icon')
  }
}
