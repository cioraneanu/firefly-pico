<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getSelectedName" is-link readonly class="app-field" left-icon="calendar-o" :label="label" placeholder="No date" v-bind="dynamicAttrs" @click="onShowDropdown">
      <template #input>
        <div>
          <div :class="labelClass">
            {{ getSelectedName }}
          </div>
        </div>
      </template>

      <template #right-icon>
        <div>
          <van-icon v-if="modelValue" name="clear" @click.prevent.stop="date = null" />
        </div>
      </template>
    </van-field>

    <app-popup v-model:show="showDropdown" style="padding-top: 4px">
        <div>
          <van-time-picker v-model="localModelValue" :filter="filter" title="Choose time" @confirm="onConfirm" />
        </div>
    </app-popup>
  </div>
</template>

<script setup>
import _ from 'lodash-es'

import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { bindOneWay } from '~/utils/VueUtils'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
    default: 'Time',
  },
})

const modelValue = defineModel()

const localModelValue = ref(null)
bindOneWay(modelValue, localModelValue)

const showDropdown = ref(false)

const filter = (type, options) => {
  if (type === 'minute') {
    return options.filter((option) => Number(option.value) % 5 === 0)
  }
  return options
}

const labelClass = computed(() => {
  return {
    'text-muted': !modelValue.value,
  }
})

const getSelectedName = computed(() => {
  if (!localModelValue.value) {
    return 'No time'
  }
  return localModelValue.value.join(' ')
})

const onConfirm = (value) => {
  showDropdown.value = false
  modelValue.value = localModelValue.value
}

const onShowDropdown = () => {
  showDropdown.value = true
}
</script>

<style></style>
