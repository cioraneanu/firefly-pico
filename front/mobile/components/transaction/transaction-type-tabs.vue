<template>
  <div class="mx-types" role="radiogroup" :aria-label="$t('transaction_type')">
    <button
      v-for="item in list"
      :key="item.code"
      type="button"
      role="radio"
      :class="[typeClass[item.code], { on: isEqual(item, modelValue) }]"
      :aria-checked="isEqual(item, modelValue)"
      @click="modelValue = item"
    >
      <app-icon :icon="typeIcon[item.code]" :size="16" :stroke="2" />
      <span>{{ $t(item.t) }}</span>
    </button>
  </div>
</template>

<script setup>
import { IconCircleArrowRight, IconCircleMinus, IconCirclePlus } from '@tabler/icons-vue'
import { isEqual } from 'lodash-es'
import Transaction from '~/core/models/Transaction'

// Outline type pills (design: .mx-types with exp / inc / tr)
const modelValue = defineModel()
const list = Transaction.typesList

const typeClass = { expense: 'exp', income: 'inc', transfer: 'tr' }
const typeIcon = { expense: IconCircleMinus, income: IconCirclePlus, transfer: IconCircleArrowRight }
</script>
