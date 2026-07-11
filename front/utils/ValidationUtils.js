export const rule = {
  // TODO: Interpolate fieldName into the message. The field name should be translated as well. Ex. The "description" field is required.
  required: () => {
    const { t } = useI18n()
    return { required: true, message: t('validation.required') }
  },

  positive: () => ({
    validator: (value) => Number.isFinite(Number(value)) && Number(value) > 0,
    message: useI18n().t('validation.positive'),
  }),

  integerRange: (min, max) => {
    const { t } = useI18n()
    return {
      validator: (value) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max,
      message: t('validation.integer_range', { min, max }),
    }
  },

  afterDate: (date, allowEqual = false) => ({
    validator: (value) => {
      if (!value || !date) {
        return true
      }
      return allowEqual ? new Date(value) >= new Date(date) : new Date(value) > new Date(date)
    },
    message: useI18n().t('validation.date_after'),
  }),
}
