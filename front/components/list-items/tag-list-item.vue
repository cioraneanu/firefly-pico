<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe" :disabled="!props.isSwipeable">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center">
            <div v-for="n in level - 1" style="width: 30px" />
            <!--            <app-icon v-if="icon" :icon="icon" :size="TablerIconConstants.defaultSize" :stroke="TablerIconConstants.defaultStroke"/>-->
            <app-icon :icon="icon ?? TablerIconConstants.tag" :size="TablerIconConstants.defaultSize" />
          </div>

          <div class="separator"></div>

          <div class="second_column display-flex flex-column">
            <div class="flex-center-vertical gap-2 overflow-visible">
              <div v-if="displayName" class="title app-tag app-select-option-text">{{ displayName }}</div>
              <div v-if="isTodo" class="tag-todo">Todo</div>
            </div>
            <div v-if="date" class="text-muted text-size-11">{{ $t('tag_page.end_date') }}: {{ date }}</div>
            <div v-if="description" class="text-muted text-size-11">{{ description }}</div>
            <div class="app-icon-item"></div>
          </div>

          <div class="flex-1"></div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @mouseup.stop="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '~/models/Tag.js'

const props = defineProps({
  value: Object,
  isSwipeable: {
    default: true,
  },
})

const emit = defineEmits(['onEdit', 'onDelete'])

const dataStore = useDataStore()

const icon = computed(() => Tag.getIcon(props.value))

const level = computed(() => get(props.value, 'level', 0))
const displayName = computed(() => get(props.value, 'attributes.tag', ' - '))
const description = computed(() => get(props.value, 'attributes.description'))
const date = computed(() => DateUtils.dateToString(get(props.value, 'attributes.date')))
const isTodo = computed(() => get(props.value, 'attributes.is_todo'))

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>

<style></style>
