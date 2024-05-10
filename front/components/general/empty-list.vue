<template>
  <div class="empty-list">
    <!--    <img :src="EmptyIllustration" style="width: 300px"/>-->
    <empty-illustration style="width: 100%" />
    <div class="mt-20">The list is empty. Add some entries with the top-right button.</div>
  </div>
</template>

<script setup>
import EmptyIllustration from '~/assets/svg/empty.svg'
// import EmptyIllustration from '~/assets/svg/undraw_Dog_c7i6.png'
</script>
