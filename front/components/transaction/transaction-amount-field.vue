<template>
  <div class="van-cell-fake pb-10">
    <div>
      <van-field
        v-model="modelValue"
        placeholder="Amount"
        @click="() => input.focus()"
        label="Amount"
        left-icon="peer-pay"
        class="flex-center-vertical app-field transaction-amount-field"
        v-bind="attrs"
        label-align="top"
      >
        <template #right-icon>
          {{ props.currency }}
        </template>

        <template #input>
          <input
            v-model="modelValue"
            @focus="onFocus"
            @blur="onBlur"
            ref="input"
            style="width: 100%; border: none; background: transparent; height: 24px"
            type="text"
            inputmode="decimal"
            :class="transactionInputClass"
          />

          <!--          <transaction-amount-field-success-animation-->
          <!--              v-if="showEvaluateSuccessAnimation"-->
          <!--          />-->
        </template>
      </van-field>
    </div>

    <table class="transaction-amount-table-buttons">
      <tr>
        <td v-for="quickButton in quickButtons">
          <van-button class="w-100 transaction-amount-button" @mousedown.prevent.stop="onQuickButton(quickButton)" type="default" size="normal">
            {{ quickButton }}
          </van-button>
        </td>
      </tr>

      <tr v-show="isInputFocused">
        <td v-for="operator in operatorsList">
          <van-button class="w-100 transaction-amount-button transaction-operation-button mt-5" @mousedown.prevent.stop="onOperation(operator)" type="default" size="normal">
            {{ operator }}
          </van-button>
        </td>
      </tr>
    </table>

    <!--    <div class="delimiter"/>-->
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { moveInputCursorToEnd, sleep } from '~/utils/VueUtils'
import { evalMath, removeEndOperators, sanitizeAmount } from '~/utils/MathUtils' // import { useDevice } from '@nuxtjs/device'
// import { useDevice } from '@nuxtjs/device'

const appStore = useAppStore()
const dataStore = useDataStore()
const attrs = useAttrs()

const props = defineProps({
  label: {
    type: String,
    default: 'Amount',
  },
  currency: {
    type: String,
    default: '',
  },
})

const modelValue = defineModel()

const transactionInputClass = computed(() => {
  return {
    transactionAmountField: true,
    animate: showEvaluateSuccessAnimation.value,
  }
})
const showEvaluateSuccessAnimation = ref(false)
const isInputFocused = ref(false)
const input = ref(null)

const { isMobile } = useDevice()

const quickButtons = appStore.quickValueButtons
const operatorsList = ref(['+', '-', '*', '/'])

const onQuickButton = async (quickButton) => {
  let value = !modelValue.value || modelValue.value === '' ? '0' : modelValue.value
  value = parseInt(value)
  modelValue.value = `${value + parseInt(quickButton)}`
}

const onFocus = () => {
  isInputFocused.value = true
}

const onBlur = async () => {
  isInputFocused.value = false
  modelValue.value = await evaluateModelValue(modelValue.value)

  // On iOS if you hide the keyboard via the "Done" button, onBlur gets called but it's not actually blurred. This is a temp fix...
  input.value?.blur()
}

const evaluateModelValue = async (amount) => {
  let newAmount = removeEndOperators(amount)
  const { wasSuccessful, hasChanged, value } = evalMath(newAmount)
  if (!wasSuccessful) {
    UIUtils.showToastError('Cannot evaluate expression')
    return
  }

  if (hasChanged) {
    showEvaluateSuccessAnimation.value = true
    await sleep(300)
    showEvaluateSuccessAnimation.value = false
  }

  return value
}

watch(modelValue, (newValue) => {
  modelValue.value = sanitizeAmount(newValue)
})

const onOperation = async (operation) => {
  modelValue.value = sanitizeAmount(modelValue.value + operation)
  moveInputCursorToEnd(input, modelValue)
}

onMounted(() => {
  // UIUtils.focusInput(input)
})
</script>

<style scoped>
.transaction-amount-table-buttons {
  margin-left: 15px;
}

.animate {
  animation: jelly 0.4s;
}

@keyframes jelly {
  0%,
  100% {
    transform: scale(1, 1);
  }
  25% {
    transform: scale(0.9, 1.1);
  }
  50% {
    transform: scale(1.1, 0.9);
  }
  75% {
    transform: scale(0.95, 1.05);
  }
}
</style>
