<template>
  <div>
    <van-field
      is-link
      readonly
      class="app-field"
      left-icon="eye-o"
      label-align="top"
      :model-value="modelValue"
      :label="label"
      placeholder="Personal token"
      @click="showDialog = true"
    >
    </van-field>

    <van-dialog confirm-button-text="OK" width="100%" style="margin: 20px; max-height: 500px" v-model:show="showDialog">
      <div class="p-20">
        <app-field
          type="textarea"
          left-icon="eye-o"
          v-model="modelValue"
          label="Personal access token"
          :rules="[{ required: true, message: 'This field is required' }]"
        />

        <div class="flex-center gap-1 mt-3">
          <van-button size="small" @click="onCopy">
            Copy
            <icon-copy :size="20" :stroke-width="1.8" />
          </van-button>

          <van-button size="small" @click="onPaste">
            Paste
            <icon-clipboard :size="20" :stroke-width="1.8" />
          </van-button>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import _ from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay } from 'date-fns'
import { IconClipboard, IconCopy } from '@tabler/icons-vue'

const dataStore = useDataStore()

const props = defineProps({
  label: {
    type: String,
    default: 'Personal token',
  },
})
const modelValue = defineModel()
const showDialog = ref(false)

const onCopy = () => {
  navigator.clipboard.writeText(modelValue.value)
  UIUtils.showToastSuccess('Copied')
}
const onPaste = async () => {
  const text = await navigator.clipboard.readText()
  modelValue.value = text
  UIUtils.showToastSuccess('Pasted')
}
</script>

<style></style>
