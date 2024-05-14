export function useFormAttributes(attributes, customAttributes = {}) {
  const dynamicAttrs = computed(() => {
    let defaultAttributes = {
      'label-align': 'top',
    }
    return { ...defaultAttributes, ...attributes, ...customAttributes }
  })

  return {
    dynamicAttrs,
  }
}
