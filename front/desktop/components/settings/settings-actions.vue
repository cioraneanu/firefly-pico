<template>
  <div class="flex items-center gap-2 border-t border-line pt-6">
    <d-button variant="primary" type="submit" :loading>{{ $t('save') }}</d-button>
    <d-button @click="emit('reset')">{{ $t('desktop.reset') }}</d-button>
    <slot />
  </div>
</template>

<script setup>
defineProps({ loading: Boolean })
const emit = defineEmits(['reset'])
</script>
