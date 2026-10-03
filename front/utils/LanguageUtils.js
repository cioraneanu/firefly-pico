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
    // Greek final sigma (ς) is the same letter as "σ"
    return text.replaceAll('ς', 'σ')
  }

  // Case and accent insensitive "contains" for search fields
  static includesSearch(text, search) {
    return LanguageUtils.removeAccentsAndLowerCase(text).includes(LanguageUtils.removeAccentsAndLowerCase(search))
  }

  static lowercase(text) {
    if (!text) {
      return ''
    }
    return text.toLowerCase()
  }


}
