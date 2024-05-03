<template>
  <transition name="fade-slide" mode="out-in">
    <div class="above-keyboard bg-success fade-slide">
      <van-button
          @mousedown.prevent.stop="onOperation('+')"
          class="ml-5"
          type="default"
          size="normal">
        +
      </van-button>

      <van-button
          @mousedown.prevent.stop="onOperation('-')"
          class="ml-5"
          type="default"
          size="normal">
        -
      </van-button>

      <van-button
          @mousedown.prevent.stop="onOperation('*')"
          class="ml-5"
          type="default"
          size="normal">
        *
      </van-button>

      <van-button
          @mousedown.prevent.stop="onOperation('/')"
          class="ml-5"
          type="default"
          size="normal">
        /
      </van-button>
    </div>
  </transition>
</template>


<script setup>
import _, { clone } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { nextTick } from 'vue'
import { addDays, startOfDay } from 'date-fns'
import { evaluate } from 'mathjs'

const dataStore = useDataStore()

const emit = defineEmits(['operator'])


const onOperation = (value) => {
  emit('operator', value)
}

onMounted(() => {

})

</script>
