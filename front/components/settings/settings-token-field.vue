<template>
  <div>
    <van-field is-link readonly class="app-field" label-align="top" :model-value="modelValue" :label="props.label ?? $t('settings.token.label')" :placeholder="$t('settings.token.placeholder')" @click="showDialog = true">
      <template #left-icon>
        <app-icon :icon="TablerIconConstants.key" :size="20" />
      </template>
    </van-field>

    <van-dialog :confirm-button-text="$t('ok')" width="100%" style="margin: 20px; max-height: 500px" v-model:show="showDialog">
      <div class="p-20">
        <app-field type="textarea" left-icon="eye-o" v-model="modelValue" :label="$t('settings.token.label')" :rules="[{ required: true, message: $t('settings.required_field') }]" />

        <div class="flex-center gap-1 mt-3">
          <van-button size="small" @click="onCopy">
            {{ $t('copy') }}
            <icon-copy :size="20" :stroke-width="1.8" />
          </van-button>

          <van-button size="small" @click="onPaste">
            {{ $t('paste') }}
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
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dataStore = useDataStore()

const props = defineProps({
  label: {
    type: String,
  },
})
const modelValue = defineModel()
const showDialog = ref(false)

const onCopy = () => {
  navigator.clipboard.writeText(modelValue.value)
  UIUtils.showToastSuccess(t('copied'))
}
const onPaste = async () => {
  const text = await navigator.clipboard.readText()
  modelValue.value = text
  UIUtils.showToastSuccess(t('pasted'))
}
</script>

<style></style>
