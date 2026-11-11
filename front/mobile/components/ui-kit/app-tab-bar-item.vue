<template>
  <a :class="{ on: isSelected }" :href="route" :aria-current="isSelected ? 'page' : null" @click.prevent="navigateTo(route, { replace: true })">
    <span class="ic"><img :src="icon" alt="" style="width: 22px; height: 22px" /></span>
    <span>{{ name }}</span>
  </a>
</template>

<script setup>
// Bottom nav item with an image icon (design: .mx-nav a). Place it inside a .mx-nav.
const props = defineProps(['route', 'name', 'icon'])

const appStore = useAppStore()
const isSelected = computed(() => appStore.activePage === props.route)
</script>
