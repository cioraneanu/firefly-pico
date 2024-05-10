export default class LanguageUtils {
  static removeAccents(text) {
    if (!text) {
      return ''
    }
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }
}
