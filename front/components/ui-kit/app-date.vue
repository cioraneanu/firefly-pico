<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getSelectedName" is-link readonly class="app-field" :label="label" placeholder="No date" v-bind="dynamicAttrs" @click="show = true">
      <template v-if="attrs.icon" #left-icon>
        <app-icon :icon="attrs.icon" :size="20" />
      </template>

      <template #input>
        <div>
          <div :class="labelClass">
            {{ getSelectedName }}
          </div>
        </div>
      </template>

      <template #right-icon>
        <div>
          <van-icon v-if="modelValue" name="clear" class="cursor-pointer" @click.prevent.stop="modelValue = null" />
        </div>
      </template>
    </van-field>

    <div v-if="false" class="display-flex" style="gap: 3px">
      <!--      <div class="van-field__label"/>-->

      <div class="display-flex flex-1 ml-15" style="justify-content: flex-start; align-items: center; gap: 3px">
        <span class="text-size-14 mr-20 text-muted">Quick actions:</span>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedMinusDay">-1</van-button>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedToday">Today</van-button>
        <van-button type="default" size="normal" @click.prevent.stop="onClickedAddDay">+1</van-button>
      </div>
    </div>

    <!--    <van-cell title="Cell title" :value="getSelectedName" is-link @click="show = true" />-->

    <van-calendar v-model:show="show" :show-confirm="false" color="#000" :min-date="minDate" @confirm="onConfirm">
      <template #title>
        <div ref="appCalendar">Select a date</div>
      </template>
    </van-calendar>
  </div>
</template>

<script setup>
import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const modelValue = defineModel()

const props = defineProps({
  label: {
    type: String,
    default: 'Date',
  },
})

const show = ref(false)

const labelClass = computed(() => {
  return {
    'text-muted': !modelValue.value,
  }
})

const getSelectedName = computed(() => {
  if (!modelValue.value) {
    return 'No date'
  }
  return DateUtils.dateToUI(modelValue.value)
})

const onConfirm = (value) => {
  show.value = false
  modelValue.value = value
  // emit('update:modelValue', value)
}

const minDate = subYears(new Date(), 5)

const onClickedMinusDay = () => {
  modelValue.value = addDays(modelValue.value, -1)
}
const onClickedToday = () => {
  modelValue.value = startOfDay(new Date())
}
const onClickedAddDay = () => {
  modelValue.value = addDays(modelValue.value, 1)
}

const appCalendar = ref(null)
useSwipeToDismiss({
  onSwipe: () => {
    show.value = false
  },
  swipeRef: appCalendar,
  showDropdown: show,
})
</script>
