<template>
  <!--  <van-button-->
  <!--      size="small"-->
  <!--      class="add-button"-->
  <!--      style="color: white; border-radius: 10px"-->
  <!--      color="#000">-->
  <!--    <div class="flex-center">-->
  <!--      <icon-plus size="12" :strokeWidth="3"/>-->
  <!--      New-->
  <!--    </div>-->
  <!--  </van-button>-->

  <van-button size="small" class="add-button" style="background: #000; color: white; font-weight: 700; border: 0; border-radius: 10px">
    <div class="flex-center" style="gap: 3px">
      <span class="">New</span>
      <!--      <icon-plus size="14" :strokeWidth="3"/>-->
    </div>
  </van-button>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
</script>
