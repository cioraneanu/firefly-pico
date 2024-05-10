<!-- OK-->
<template>
  <div>
    <draggable v-model="modelValue" handle=".app-repeater-handle" class="w-100" itemKey="id">
      <template #item="{ element, index }">
        <div>
          <!--          <van-swipe-cell>-->
          <!--            <div class="flex-center-vertical">-->
          <!--              <div v-if="!disabled && isDraggable" class="p-2 app-repeater-handle">-->
          <!--                <Icon name="pepicons-pop:grab-handle" size="20" class=""/>-->
          <!--              </div>-->

          <!--              <div class="flex-1">-->
          <!--                <slot name="content" v-bind="{ index, element, removeItemAtIndex }"/>-->
          <!--              </div>-->
          <!--            </div>-->

          <!--            <template #right>-->
          <!--              <van-button square type="danger" text="Delete" />-->
          <!--              <van-button square type="primary" text="Collect" />-->
          <!--            </template>-->
          <!--          </van-swipe-cell>-->

          <div class="flex-center-vertical">
            <div v-if="!disabled && isDraggable" class="p-1 app-repeater-handle">
              <app-icon :icon="TablerIconConstants.repeaterHandler" :size="20" />
            </div>

            <div class="flex-1">
              <slot name="content" v-bind="{ index, element, removeItemAtIndex }" />
            </div>

            <van-button v-if="!props.disabled && props.isListDynamic" @click="removeItemAtIndex(index)">
              <van-icon name="delete-o" size="20" />
            </van-button>
          </div>
        </div>
      </template>

      <template #footer>
        <div>
          <div class="app-repeater-no-values" v-if="isListEmpty">No values set. Use the 'add' button.</div>
          <div v-if="!props.disabled && props.isListDynamic">
            <van-button class="w-100" style="border: 1px dashed #888" @click="addItem"> Add </van-button>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { cloneDeep, isEmpty } from 'lodash'
import draggable from 'vuedraggable'
import { computed, defineModel } from 'vue'
import TablerIconConstants from '~/constants/TablerIconConstants'

const props = defineProps({
  emptyItem: {},
  isDraggable: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isListDynamic: {
    type: Boolean,
    default: true,
  },
})

const modelValue = defineModel()

const isListEmpty = computed(() => {
  return isEmpty(modelValue.value)
})

// const draggableElementClass = computed(() => {
//   return {
//     'draggable-list-element': props.isDraggable && !props.disabled
//   }
// })

const addItem = () => {
  let oldValue = modelValue.value ?? []
  oldValue.push(cloneDeep(props.emptyItem) ?? {})
  modelValue.value = oldValue
}
const removeItemAtIndex = (index) => {
  modelValue.value.splice(index, 1)
}
</script>

<style scoped></style>
