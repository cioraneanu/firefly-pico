<template>

  <!--  <van-popover v-model:show="showPopover">-->

  <!--    <div @click="showPopover = false" class="app-tutorial-popover" style="width: 260px;">-->
  <!--      <div class="app-toolbar-title">{{ props.title }}</div>-->
  <!--      <div class="app-toolbar-body" v-html="props.body"></div>-->
  <!--    </div>-->

  <!--    <template #reference>-->
  <!--      <div class="app-tutorial-button">?</div>-->
  <!--    </template>-->
  <!--  </van-popover>-->


  <div class="app-tutorial">
    <div @click.stop.prevent="showPopover = true" class="app-tutorial-button">?</div>

    <van-dialog v-model:show="showPopover" confirm-button-text="OK" :close-on-click-overlay="true">
      <div class="p-20">
        <div class="app-toolbar-title mb-10">{{ props.title }}</div>
        <div class="app-toolbar-body" style="overflow: auto; max-height: 70vh" v-html="props.body"></div>
      </div>
    </van-dialog>
  </div>

</template>


<script setup>

const showPopover = ref(false)
const props = defineProps({
  title: {},
  body: {},
})


</script>

<style>

</style>