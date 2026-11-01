<template>
  <van-tabbar-item replace :to="route" :name="route">
    <template #icon>
      <div class="flex-col flex items-center justify-center">
        <img :src="icon" style="width: 25px; height: 25px" >
        <div class="van-tabbar-item">{{ name }}</div>
      </div>
    </template>
  </van-tabbar-item>
</template>

<script setup>
const props = defineProps(['route', 'name', 'icon'])
</script>

