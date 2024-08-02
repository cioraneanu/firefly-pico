<template>
  <div class="van-cell-fake pb-10">
    <!--    Amount field    -->
    <div>
      <van-field
        v-model="modelValue"
        placeholder="Amount"
        @click="() => inputAmount.focus()"
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
            ref="inputAmount"
            style="width: 100%; border: none; background: transparent; height: 24px"
            type="text"
            inputmode="decimal"
            :class="transactionInputClass"
          />
        </template>
      </van-field>
    </div>

<!--          <app-icon icon="svgo-custom-exchange" style="width: 20px; margin-left: 16px" />-->

    <!--    Foreign amount field    -->
<!--    display-flex align-items-start-->
    <div v-if="props.isForeignAmountVisible" class="flex-center-vertical">
      <app-icon icon="svgo-custom-exchange" style="width: 22px; margin-left: 16px" />

      <van-field
        v-model="modelValueForeign"
        placeholder="Foreign amount "
        @click="() => inputAmountForeign.focus()"
        label="Foreign amount"
        left-icon="peer-pay"
        class="flex-1 flex-center-vertical app-field transaction-amount-field"
        v-bind="attrs"
        label-align="top">
        <template #right-icon>
          {{ props.currencyForeign }}
        </template>

        <template #input>
          <input
            v-model="modelValueForeign"
            ref="inputAmountForeign"
            style="width: 100%; border: none; background: transparent; height: 24px"
            type="text"
            inputmode="decimal"
            class="transactionAmountField"
          />
        </template>
      </van-field>
    </div>

    <table v-if="showQuickButtons" class="transaction-amount-table-buttons">
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
import { evalMath, removeEndOperators, sanitizeAmount } from '~/utils/MathUtils'

const profileStore = useProfileStore()
const dataStore = useDataStore()
const attrs = useAttrs()

const modelValue = defineModel()
const modelValueForeign = defineModel('foreign')

const props = defineProps({
  showQuickButtons: {
    type: Boolean,
    default: true,
  },
  currency: {
    type: String,
    default: '',
  },
  currencyForeign: {
    type: String,
    default: '',
  },
  isForeignAmountVisible: {
    type: Boolean,
    default: false,
  },
})

const transactionInputClass = computed(() => {
  return {
    transactionAmountField: true,
    animate: showEvaluateSuccessAnimation.value,
  }
})
const showEvaluateSuccessAnimation = ref(false)
const isInputFocused = ref(false)
const inputAmount = ref(null)
const inputAmountForeign = ref(null)

const quickButtons = profileStore.quickValueButtons
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
  inputAmount.value?.blur()
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
