<template>
  <form :name="name" novalidate @submit.prevent="submit">
    <slot />
  </form>
</template>

<script setup>
// The form element of the kit: fields register through useFormField(); submit validates them in order
// and calls @submit (awaited: isSubmitting is true meanwhile), or emits `failed` with { errors: [{ name, message }] } (the shape useForm expects).
const props = defineProps({
  name: { type: String, default: null },
  onSubmit: { type: Function, default: null },
})

const emit = defineEmits(['failed'])

const fields = []
const isSubmitting = ref(false)
provide('appForm', {
  isSubmitting,
  register: (field) => {
    fields.push(field)
    return () => fields.splice(fields.indexOf(field), 1)
  },
})

const validate = async () => {
  const errors = []
  for (const field of fields) {
    const message = await field.validate()
    if (message) {
      errors.push({ name: field.name(), message })
    }
  }
  return errors
}

const submit = async () => {
  if (isSubmitting.value) return
  const errors = await validate()
  if (errors.length) {
    emit('failed', { errors })
    return
  }
  isSubmitting.value = true
  await props.onSubmit?.()
  isSubmitting.value = false
}

defineExpose({ validate, submit })
</script>
