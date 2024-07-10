export default class LanguageUtils {
  static removeAccents(text) {
    if (!text) {
      return ''
    }
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  static removeAccentsAndLowerCase(text) {
    text = LanguageUtils.removeAccents(text)
    text = LanguageUtils.lowercase(text)
    return text
  }

  static lowercase(text) {
    if (!text) {
      return ''
    }
    return text.toLowerCase()
  }


}
