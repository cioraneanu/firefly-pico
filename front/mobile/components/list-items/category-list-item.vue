<template>
  <app-list-item @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead sm"><app-icon :icon="icon ?? TablerIconConstants.category" :size="16" :stroke="2" /></span>
    <span class="mx-row__m"
      ><span class="mx-row__t">{{ displayName }}</span></span
    >
    <span class="mx-chev"><app-icon :icon="IconChevronRight" :size="16" :stroke="2" /></span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconChevronRight } from '@tabler/icons-vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Account from '~/core/models/Account.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const icon = computed(() => Account.getIcon(props.value))
</script>
