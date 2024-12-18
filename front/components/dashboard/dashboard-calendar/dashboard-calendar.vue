<template>
  <van-cell-group inset style="overflow: auto">
    <dashboard-calendar-month />
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from "~/constants/TablerIconConstants";
import Transaction from "~/models/Transaction";
</script>