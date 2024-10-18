<template>
  <van-action-sheet v-model:show="show" :actions="actions" :close-on-click-overlay="true" :close-on-click-action="true" title="Select an option">
<!--    <template #description>-->
<!--      &lt;!&ndash;      TODO: Find solution. Sadly using this component with h() render function doesnt work for app-icon because of dynamic component usage.... &ndash;&gt;-->
<!--      <app-icon :icon="TablerIconConstants.account" :size="20" />-->
<!--      Debug-->
<!--    </template>-->
    <template #action="{ action, index }">
      <div class="flex-center">
        <div>{{ action.name }}</div>
      </div>
    </template>
  </van-action-sheet>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AppIcon from '~/components/ui-kit/app-icon.vue'

const show = defineModel('show')

const props = defineProps({
  actions: {},
})
</script>

<style></style>
