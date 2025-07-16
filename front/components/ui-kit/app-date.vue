<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getSelectedName" is-link readonly class="app-field" :label="label" placeholder="No date" @click="show = true" v-bind="dynamicAttrs">

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
          <van-icon v-if="modelValue" @click.prevent.stop="date = null" name="clear" />
        </div>
      </template>
    </van-field>

    <div v-if="false" class="display-flex" style="gap: 3px">
      <!--      <div class="van-field__label"/>-->

      <div class="display-flex flex-1 ml-15" style="justify-content: flex-start; align-items: center; gap: 3px">
        <span class="text-size-14 mr-20 text-muted">Quick actions:</span>
        <van-button @click.prevent.stop="onClickedMinusDay" type="default" size="normal">-1</van-button>
        <van-button @click.prevent.stop="onClickedToday" type="default" size="normal">Today</van-button>
        <van-button @click.prevent.stop="onClickedAddDay" type="default" size="normal">+1</van-button>
      </div>
    </div>

    <!--    <van-cell title="Cell title" :value="getSelectedName" is-link @click="show = true" />-->

    <van-calendar v-model:show="show" @confirm="onConfirm" :show-confirm="false" color="#000" :min-date="minDate">
      <template #title>
        <div ref="appCalendar">Select a date</div>
      </template>
    </van-calendar>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss.js'

const dataStore = useDataStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  modelValue: Object,
  label: {
    type: String,
    default: 'Date',
  },
})

const emit = defineEmits(['update:modelValue'])

const date = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

const show = ref(false)

const labelClass = computed(() => {
  return {
    'text-muted': !props.modelValue,
  }
})

const getSelectedName = computed(() => {
  if (!props.modelValue) {
    return 'No date'
  }
  return DateUtils.dateToUI(props.modelValue)
})

const onConfirm = (value) => {
  show.value = false
  date.value = value
  // emit('update:modelValue', value)
}

const minDate = subYears(new Date(), 5)

const onClickedMinusDay = () => {
  date.value = addDays(date.value, -1)
}
const onClickedToday = () => {
  date.value = startOfDay(new Date())
}
const onClickedAddDay = () => {
  date.value = addDays(date.value, 1)
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

<style></style>
