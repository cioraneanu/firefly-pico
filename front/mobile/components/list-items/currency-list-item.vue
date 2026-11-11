<template>
  <app-list-item :row-class="{ mid: true, 'is-off': !isEnabled }" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead sm"><app-icon :icon="TablerIconConstants.currency" :size="16" :stroke="2" /></span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ displayName }}</span>
      <span v-if="isDefault || !isEnabled" class="mx-row__s">{{ isDefault ? $t('desktop.default_currency') : $t('desktop.disabled') }}</span>
    </span>
    <span v-if="symbol" class="mx-badge">{{ symbol }}</span>
    <span class="mx-chev"><app-icon :icon="IconChevronRight" :size="16" :stroke="2" /></span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconChevronRight } from '@tabler/icons-vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const symbol = computed(() => get(props.value, 'attributes.symbol'))
const isEnabled = computed(() => get(props.value, 'attributes.enabled', true))
const isDefault = computed(() => !!get(props.value, 'attributes.default'))
</script>
