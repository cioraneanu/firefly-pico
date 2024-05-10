<template>
  <div class="">
    <!--    <van-cell :title="label" :value="date" @click="show = true"/>-->
    <van-field v-model="getSelectedName" is-link readonly class="app-field" left-icon="calendar-o" :label="label" placeholder="No date" @click="onShowDropdown" v-bind="dynamicAttrs">
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

    <van-popup v-model:show="showDropdown" round position="bottom" style="padding-top: 4px">
      <div ref="popupRef" class="h-100 display-flex flex-column">
        <!--        <div class="display-flex">-->
        <!--          <van-button>Cancel</van-button>-->
        <!--          <div class="flex-1">Choose time</div>-->
        <!--          <van-button>Confirm</van-button>-->
        <!--        </div>-->

        <div>
          <van-time-picker v-model="localModelValue" :filter="filter" title="Choose time" @confirm="onConfirm" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import _ from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { bindOneWay } from '~/utils/VueUtils'

const dataStore = useDataStore()
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
