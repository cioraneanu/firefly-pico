<template>
  <div class="p-2">
    <div class="font-600">Attachments</div>

    <div class="display-flex gap-1">
      <transaction-attachment v-for="item in list" :value="item" />

      <div class="p-2">
        <icon-square-plus :size="50" :stroke="0.8" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconSquarePlus } from '@tabler/icons-vue'
import TransactionAttachment from '~/components/transaction/transaction-attachements/transaction-attachment.vue'

const props = defineProps({
  transaction: {},
  list: {},
})
</script>
