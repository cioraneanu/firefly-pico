export function useFormAttributes(attributes, customAttributes = {}) {
  const dynamicAttrs = computed(() => {
    let defaultAttributes = {
      'label-align': 'top',
      'placeholder': attributes?.label
    }
    return { ...defaultAttributes, ...attributes, ...customAttributes }
  })

  return {
    dynamicAttrs,
  }
}
