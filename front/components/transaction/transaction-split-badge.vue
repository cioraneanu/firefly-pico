<template>
  <div class="split-transaction-badge transaction-desktop-split gap-1">
    <app-icon :icon="TablerIconConstants.lock" :size="14" />
    <div class="">{{ $t('transaction.split_short') }}</div>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants'
</script>
