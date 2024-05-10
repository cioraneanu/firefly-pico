import { avatarListIcons, duoToneListIcons, fluentListIcons } from '~/constants/SvgConstants.js'
import BaseModel from '~/models/BaseModel'
// import { appSelectIcons } from '~/constants/TablerIconConstants.js'

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
    if (iconName.startsWith('svgo-duo')) {
      iconsList = duoToneListIcons
    }
    if (iconName.startsWith('svgo-fluent')) {
      iconsList = fluentListIcons
    }
    if (iconName.startsWith('svgo-avatar')) {
      iconsList = avatarListIcons
    }
    // if (iconName.startsWith('Icon')) {
    //   iconsList = appSelectIcons
    // }
    return iconsList.find((item) => item.icon === iconName)
  }
}
