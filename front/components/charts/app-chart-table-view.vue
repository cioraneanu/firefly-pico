<template>
  <van-collapse v-model="activeCollapse">
    <van-collapse-item :title="title" name="table">
      <div class="app-chart-table-view-wrapper">
        <slot />
      </div>
    </van-collapse-item>
  </van-collapse>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
})

const activeCollapse = ref([])
</script>

<style scoped>
.app-chart-table-view-wrapper {
  overflow-x: auto;
}

.app-chart-table-view-wrapper :deep(table) {
  width: 100%;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.app-chart-table-view-wrapper :deep(th),
.app-chart-table-view-wrapper :deep(td) {
  padding: 4px 8px;
  text-align: right;
  white-space: nowrap;
}

.app-chart-table-view-wrapper :deep(th:first-child),
.app-chart-table-view-wrapper :deep(td:first-child) {
  text-align: left;
}
</style>
