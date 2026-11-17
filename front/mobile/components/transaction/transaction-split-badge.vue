<template>
  <span class="mx-chip split">
    <app-icon :icon="IconArrowsSplit2" :size="12" :stroke="2" />
    <span>{{ $t('transaction.split_short') }}</span>
  </span>
</template>

<script setup>
import { IconArrowsSplit2 } from '@tabler/icons-vue'
</script>
