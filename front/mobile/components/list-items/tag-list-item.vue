<template>
  <component :is="isSwipeable ? AppListItem : 'div'" :class="{ 'mx-row mid min-w-0 flex-1': !isSwipeable }" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span v-if="level > 1" class="flex-none" :style="{ width: `${(level - 1) * 20}px` }" />
    <span class="mx-lead sm"><app-icon :icon="icon ?? TablerIconConstants.tag" :size="16" :stroke="2" /></span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ displayName }}</span>
      <span v-if="description" class="mx-row__s">{{ description }}</span>
      <span v-if="isTodo || date || totalFormatted" class="mx-chips">
        <span v-if="isTodo" class="mx-chip todo"
          ><app-icon :icon="IconListCheck" :size="12" :stroke="2" /><span>{{ $t('todo') }}</span></span
        >
        <span v-if="date" class="mx-chip"
          ><app-icon :icon="IconCalendarEvent" :size="12" :stroke="2" /><span>{{ $t('tag_page.end_date') }}: {{ date }}</span></span
        >
        <span v-if="totalFormatted" class="mx-chip"
          ><app-icon :icon="IconSum" :size="12" :stroke="2" /><span>{{ $t('tag_page.total') }}: {{ totalFormatted }}</span></span
        >
      </span>
    </span>
    <span v-if="isSwipeable" class="mx-chev"><app-icon :icon="IconChevronRight" :size="16" :stroke="2" /></span>
  </component>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconCalendarEvent, IconChevronRight, IconListCheck, IconSum } from '@tabler/icons-vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Tag from '~/core/models/Tag.js'
import AppListItem from '~/mobile/components/list-items/app-list-item.vue'

const props = defineProps({
  value: Object,
  // false = plain row (used inside the tag picker)
  isSwipeable: {
    default: true,
  },
})

const emit = defineEmits(['onEdit', 'onDelete'])

const icon = computed(() => Tag.getIcon(props.value))

const level = computed(() => get(props.value, 'level', 0))
const displayName = computed(() => get(props.value, 'attributes.tag', ' - '))
const description = computed(() => get(props.value, 'attributes.description'))
const date = computed(() => DateUtils.dateToString(get(props.value, 'attributes.date')))
const isTodo = computed(() => get(props.value, 'attributes.is_todo'))
const totalFormatted = computed(() => Tag.getTotalFormatted(props.value))
</script>
