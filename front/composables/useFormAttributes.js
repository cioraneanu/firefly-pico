export function useFormAttributes (attributes) {

  const dynamicAttrs = computed(() => {
    let defaultAttributes = {
      'label-align': 'top',
    }
    return { ...defaultAttributes, ...attributes }
  })

  return {
    dynamicAttrs
  }
}
