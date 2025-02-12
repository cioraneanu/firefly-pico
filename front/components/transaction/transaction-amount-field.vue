<template>
  <div class="van-cell-fake pb-10">
    <!--    Amount field    -->
    <div>
      <van-field
        v-model="modelValue"
        placeholder="Amount"
        @click="() => inputAmount.focus()"
        label="Amount"
        class="flex-center-vertical app-field transaction-amount-field"
        v-bind="attrs"
        label-align="top"
      >
        <template #left-icon>
          <app-icon :icon="TablerIconConstants.cashBanknote" :size="20" />
        </template>

        <template #right-icon>
          <div class="flex-center-vertical gap-2">
            {{ props.currency ? props.currency.symbol : '' }}
          </div>
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

    <template v-if="props.isForeignAmountVisible">
      <div class="flex-center">
        <van-button @click="convertAmountToForeign" size="small" class="mr-10">
          <template #icon>
            <div class="display-flex">
              <app-icon :icon="TablerIconConstants.transaction" :size="16" />
              <app-icon :icon="TablerIconConstants.downArrow" :size="16" />
            </div>
          </template>
        </van-button>

        <van-button @click="convertForeignToAmount" size="small" class="mr-10">
          <template #icon>
            <div class="display-flex">
              <app-icon :icon="TablerIconConstants.transaction" :size="16" />
              <app-icon :icon="TablerIconConstants.upArrow" :size="16" />
            </div>
          </template>
        </van-button>
      </div>

      <!--    Foreign amount field    -->
      <div class="flex-center-vertical">
        <!--      <app-icon :icon="SvgConstants.custom.exchange" style="width: 22px; margin-left: 16px" />-->

        <van-field
          v-model="modelValueForeign"
          placeholder="Foreign amount "
          @click="() => inputAmountForeign.focus()"
          label="Foreign amount"
          class="flex-1 flex-center-vertical app-field transaction-amount-field transaction-foreign-amount-field"
          v-bind="attrs"
          label-align="top"
        >
          <template #left-icon>
            <app-icon :icon="TablerIconConstants.cash" :size="20" />
          </template>

          <template #right-icon>
            {{ props.currencyForeign ? props.currencyForeign.symbol : '' }}
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
    </template>

    <table v-if="showQuickButtons && !disabled" class="transaction-amount-table-buttons">
      <tbody>
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
      </tbody>
    </table>

    <!--    <div class="delimiter"/>-->
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { moveInputCursorToEnd, sleep } from '~/utils/VueUtils'
import { evalMath, removeEndOperators, sanitizeAmount } from '~/utils/MathUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

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
    type: Object,
    default: null,
  },
  currencyForeign: {
    type: Object,
    default: null,
  },
  isForeignAmountVisible: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false
  }
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

const convertAmountToForeign = () => {
  modelValueForeign.value = convertCurrency(modelValue.value, props.currency.code, props.currencyForeign.code).toFixed(2)
}

const convertForeignToAmount = () => {
  modelValue.value = convertCurrency(modelValueForeign.value, props.currencyForeign.code, props.currency.code).toFixed(2)
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
