export const rule = {

  // TODO: Interpolate fieldName into the message. The field name should be translated as well. Ex. The "description" field is required.
  required: (fieldName) => {
    const { t } = useI18n()
    return { required: true, message: t('validation.required') }
  },

}
