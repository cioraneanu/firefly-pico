<template>
  <form :name="name" novalidate @submit.prevent="submit">
    <slot />
  </form>
</template>

<script setup>
// The form element of the kit: fields register through useFormField(); submit validates them in order
// and emits `submit`, or `failed` with { errors: [{ name, message }] } (the shape useForm expects).
defineProps({
  name: { type: String, default: null },
})

const emit = defineEmits(['submit', 'failed'])

const fields = []
provide('appForm', {
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
  const errors = await validate()
  if (errors.length) {
    emit('failed', { errors })
    return
  }
  emit('submit')
}

defineExpose({ validate, submit })
</script>
