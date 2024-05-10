import { format, parse, parseISO } from 'date-fns'

class DateUtils {
  /// ======================== THE REAL DATE UTIL STARTS HERE ============================
  /// --------------------------------- CONSTANTS ----------------------------------------

  static get FORMAT_ROMANIAN_DATE() {
    return 'dd.MM.yyyy'
  }

  static get FORMAT_ROMANIAN_DATE_HOUR_MINUTE() {
    return 'dd.MM.yyyy HH:mm'
  }

  static get FORMAT_ENGLISH_DATE() {
    return 'yyyy-MM-dd'
  }

  static get FORMAT_ENGLISH_DATE_HOUR_MINUTE() {
    return 'yyyy-MM-dd HH:mm'
  }

  /// --------------------------------- FUNCTIONS ----------------------------------------

  static stringToDate(dateString, format = this.FORMAT_ENGLISH_DATE) {
    if (!dateString) {
      return null
    }
    return parse(dateString, format, new Date())
  }

  static stringFromTo(date, formatFrom = this.FORMAT_ENGLISH_DATE, formatTo = this.FORMAT_ROMANIAN_DATE) {
    if (!date) {
      return null
    }
    const sourceDate = parse(date, formatFrom, new Date())
    return format(sourceDate, formatTo)
  }

  static dateToString(date, dateFormat = this.FORMAT_ENGLISH_DATE) {
    if (!date) {
      return null
    }
    return format(date, dateFormat)
  }

  static autoToString(date, dateFormat = this.FORMAT_ROMANIAN_DATE) {
    if (!date) {
      return null
    }
    if (date instanceof Date) {
      return this.dateToString(date, dateFormat)
    }
    return this.dateToString(new Date(date), dateFormat)
  }

  static autoToDate(date) {
    if (!date) {
      return null
    }
    if (date instanceof Date) {
      return date
    }

    let dateWithoutTimezone = date.split('+')[0]
    return parseISO(dateWithoutTimezone)
  }

  static dateToUI(date) {
    const appStore = useAppStore()
    return this.dateToString(date, appStore.dateFormat)
  }

  static dateToUIWithTime(date) {
    const appStore = useAppStore()
    return this.dateToString(date, `${appStore.dateFormat} HH:mm`)
  }
}

export default DateUtils
