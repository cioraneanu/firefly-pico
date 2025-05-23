<template>
  <div class="profile-picker overflow-auto gap-1">
    <div v-for="profile in profiles" class="profile-picker-card">
      {{ profile.name }}
    </div>

    <div class="profile-picker-card-add">
      <icon-plus :size="20" :stroke="2.0" />
    </div>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'

const props = defineProps({})

const profiles = ref([{ name: 'My first profile' }, { name: 'Wow another one' }, { name: 'Third profile' }, { name: 'Third profile' }, { name: 'Third profile' }])
</script>
