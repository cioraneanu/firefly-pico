export const rule = {

  // TODO: Interpolate fieldName into the message. The field name should be translated as well. Ex. The "description" field is required.
  required: (fieldName) => {
    const { t } = useI18n()
    return { required: true, message: t('validation.required') }
  },

  positive: () => ({
    validator: (value) => Number.isFinite(Number(value)) && Number(value) > 0,
    message: 'Value must be greater than 0',
  }),

  integerRange: (min, max) => ({
    validator: (value) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max,
    message: `Value must be between ${min} and ${max}`,
  }),

  afterDate: (date, allowEqual = false) => ({
    validator: (value) => {
      if (!value || !date) {
        return true
      }
      return allowEqual ? new Date(value) >= new Date(date) : new Date(value) > new Date(date)
    },
    message: 'Date must be later than the minimum date',
  }),

}
