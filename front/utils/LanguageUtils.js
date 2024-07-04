export default class LanguageUtils {
  static removeAccents(text) {
    if (!text) {
      return ''
    }
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  static forceLowerCase(text) {
    if (!text) {
      return ''
    }
    return text.toLowerCase()
  }

  static removeAccentsAndForceLowerCase(text) {
    text = LanguageUtils.removeAccents(text)
    text = LanguageUtils.forceLowerCase(text)
    return text
  }
}
