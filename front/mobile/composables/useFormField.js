import { computed, inject, isRef, onBeforeUnmount, ref, toValue, watch } from 'vue'

// Registers a control with the surrounding <app-form> and validates it with the same `rule` objects
// the pages already pass (required / validator / message), so ValidationUtils stays unchanged.
export function useFormField({ name, rules, value }) {
  const form = inject('appForm', null)
  const error = ref('')

  const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

  const validate = async () => {
    const current = isRef(value) ? value.value : value()
    for (const rule of toValue(rules) ?? []) {
      if (rule.required && isEmpty(current)) {
        error.value = rule.message
        return error.value
      }
      if (rule.validator && !isEmpty(current)) {
        const result = await rule.validator(current, rule)
        if (result === false || typeof result === 'string') {
          error.value = typeof result === 'string' ? result : rule.message
          return error.value
        }
      }
    }
    error.value = ''
    return ''
  }

  const isRequired = computed(() => (toValue(rules) ?? []).some((rule) => rule.required))

  if (form) {
    const unregister = form.register({ name: () => toValue(name), validate })
    onBeforeUnmount(unregister)
  }

  // Clear the error as soon as the user fixes the value
  watch(
    () => (isRef(value) ? value.value : value()),
    () => error.value && validate(),
  )

  return { error, validate, isRequired }
}
