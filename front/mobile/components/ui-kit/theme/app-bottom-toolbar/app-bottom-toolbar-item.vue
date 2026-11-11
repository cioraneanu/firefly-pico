<template>
  <a :class="{ on: isSelected }" :href="route" :aria-current="isSelected ? 'page' : null" @click.prevent="navigateTo(route)">
    <span class="ic">
      <app-icon :icon="icon" :size="22" :stroke="1.75" />
      <span v-if="dot" class="dot" />
    </span>
    <span>{{ label }}</span>
  </a>
</template>

<script setup>
const props = defineProps({
  route: { type: String, required: true },
  icon: { required: true },
  label: { type: String, default: '' },
  dot: { type: Boolean, default: false },
})

const appStore = useAppStore()
const isSelected = computed(() => appStore.activePage === props.route)
</script>
