<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container" :class="itemClass">
          <div class="first_column flex-center flex-column">
            <app-icon :icon="TablerIconConstants.currency" :size="TablerIconConstants.sizeItemList" :class="itemClass" />
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1">
            <div v-if="displayName" class="title">{{ displayName }}</div>
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import _ from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const dataStore = useDataStore()

const displayName = computed(() => _.get(props.value, 'attributes.name', ' - '))

const itemClass = computed(() => ({
  'list-item-disabled': !_.get(props.value, 'attributes.enabled', true)
}))

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
