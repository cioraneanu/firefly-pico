<template>
  <div class="p-2">
    <div class="font-600">Attachments</div>

    <div class="display-flex gap-1">
      <transaction-attachment v-for="item in list" :value="item" />
      <div class="bg-info" style="width: 30px; height: 30px">+</div>
    </div>
  </div>
</template>

<script setup>
import TransactionAttachment from '~/components/transaction/transaction-attachements/transaction-attachment.vue'

const props = defineProps({
  transaction: {},
  list: {},
})
</script>