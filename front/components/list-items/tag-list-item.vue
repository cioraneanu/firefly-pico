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
import _, { get } from 'lodash'
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
const displayName = computed(() => _.get(props.value, 'attributes.tag', ' - '))
const isTodo = computed(() => _.get(props.value, 'attributes.is_todo'))

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
