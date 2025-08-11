<template>
  <div class="van-cell-fake pb-10">
    <div>
      <van-field v-model="amount" :label="$t('amount')" :placeholder="$t('amount')" class="flex-center-vertical app-field transaction-amount-field" v-bind="amountBindings" label-align="top">
        <template #left-icon>
          <app-icon :icon="TablerIconConstants.cashBanknote" :size="20" />
        </template>

        <template #right-icon>
          <div class="flex-center-vertical gap-2">
            {{ currencySymbol ?? '' }}
          </div>
        </template>

        <template #input>
          <div class="flex-center-vertical w-100">
            <input
              v-model="amount"
              @focus="onFocus"
              @blur="onBlur"
              ref="inputAmount"
              style="width: 100%; border: none; background: transparent; height: 24px"
              type="text"
              inputmode="decimal"
              class="transaction-amount-field-input"
            />
            <van-button v-if="isConvertButtonVisible" @click="convertAmountToForeign" size="small" class="">
              <template #icon>
                <div class="display-flex">
                  <app-icon :icon="TablerIconConstants.transaction" :size="16" />
                  <app-icon :icon="TablerIconConstants.downArrow" :size="16" />
                </div>
              </template>
            </van-button>
          </div>
        </template>
      </van-field>
    </div>

    <template v-if="props.isForeignAmountVisible">
      <!--    Foreign amount field    -->
      <div class="flex-center-vertical">
        <van-field
          v-model="amountForeign"
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
            <div class="flex-center" @click.prevent.stop>
              <currency-dropdown v-model="currencyForeign" class="borderless" />
            </div>
          </template>

          <template #input>
            <div class="flex-center-vertical gap-1 w-100">
              <input v-model="amountForeign" ref="inputAmountForeign" style="width: 100%; border: none; background: transparent; height: 24px" type="text" inputmode="decimal" />

              <van-button v-if="isConvertButtonVisible" @click="convertForeignToAmount" size="small" class="">
                <template #icon>
                  <div class="display-flex">
                    <app-icon :icon="TablerIconConstants.transaction" :size="16" />
                    <app-icon :icon="TablerIconConstants.upArrow" :size="16" />
                  </div>
                </template>
              </van-button>
            </div>
          </template>
        </van-field>
      </div>
    </template>

    <table v-if="showQuickButtons && !disabled" class="ml-15">
      <tbody>
        <tr>
          <td v-for="quickButton in quickButtons">
            <van-button class="w-100 transaction-amount-button" @mousedown.prevent.stop="onQuickButton(quickButton)" type="default" size="normal">
              {{ quickButton }}
            </van-button>
          </td>
        </tr>
      </tbody>
    </table>

    <transaction-amount-field-operations v-if="isFocused && device.isMobileOrTablet" @result="onOperation" />
  </div>
</template>

<script setup>
import { evalMath, removeEndOperators, sanitizeAmount } from '~/utils/MathUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Currency from '~/models/Currency.js'
import { animateShakeAmountInput, animateTransactionAmountOperatorButtons } from '~/utils/AnimationUtils.js'

const device = useDevice()
const profileStore = useProfileStore()
const attrs = useAttrs()
const amountBindings = computed(() => {
  return {
    ...attrs,
    ...(props.isAmountRequired
      ? {
          required: true,
          rules: [{ required: true, message: 'Amount is required' }],
        }
      : {}),
  }
})

const amount = defineModel('amount')
const amountForeign = defineModel('amountForeign')
const currencyForeign = defineModel('currencyForeign')
const isFocused = ref(false)

const props = defineProps({
  showQuickButtons: {
    type: Boolean,
    default: true,
  },
  currency: {
    type: Object,
    default: null,
  },
  isForeignAmountVisible: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isAmountRequired: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['focus'])

const currencySymbol = computed(() => Currency.getSymbol(props.currency))
const currencyForeignSymbol = computed(() => Currency.getSymbol(currencyForeign.value))

const currencyCode = computed(() => Currency.getCode(props.currency))
const currencyForeignCode = computed(() => Currency.getCode(currencyForeign.value))

const currencyDecimalPlaces = computed(() => Currency.getDecimalPlaces(props.currency))
const currencyForeignDecimalPlaces = computed(() => Currency.getDecimalPlaces(currencyForeign.value))
const isConvertButtonVisible = computed(() => props.isForeignAmountVisible && currencyForeign.value)

const inputAmount = ref(null)
const inputAmountForeign = ref(null)

const quickButtons = profileStore.quickValueButtons

const onQuickButton = async (quickButton) => {
  let value = !amount.value || amount.value === '' ? '0' : amount.value
  value = parseInt(value)
  amount.value = `${value + parseInt(quickButton)}`
}

const onFocus = () => {
  isFocused.value = true
}

const onBlur = async () => {
  await nextTick()
  isFocused.value = false
  let newAmount = await evaluateModelValue(amount.value)
  if (newAmount) {
    newAmount = currencyDecimalPlaces.value ? newAmount.toFixed(currencyDecimalPlaces.value) : newAmount.toString()
  }
  amount.value = newAmount

  // On iOS if you hide the keyboard via the "Done" button, onBlur gets called but it's not actually blurred. This is a temp fix...
  inputAmount.value?.blur()
}

const evaluateModelValue = async (amount) => {
  let newAmount = removeEndOperators(amount)
  const { wasSuccessful, value } = evalMath(newAmount)
  if (!wasSuccessful) {
    UIUtils.showToastError('Cannot evaluate expression')
    return
  }

  const hasChanged = parseFloat(newAmount ?? 0) !== parseFloat(value ?? 0)
  hasChanged ? await animateShakeAmountInput() : null

  return value
}

watch(amount, (newValue) => {
  amount.value = sanitizeAmount(newValue)
})

const onOperation = async (button) => {
  amount.value = sanitizeAmount(amount.value + button.value)
  // moveInputCursorToEnd(input, amount)
}

const getConversionError = () => {
  if (!props.currency) {
    return 'Source currency is required!'
  }
  if (!currencyForeign.value) {
    return 'Foreign currency is required!'
  }
}

const isConversionValid = () => {
  let error = getConversionError()
  error ? UIUtils.showToastError(error) : null
  return !error
}

const convertAmountToForeign = () => {
  if (!isConversionValid()) {
    return
  }
  amountForeign.value = convertCurrency(amount.value, currencyCode.value, currencyForeignCode.value).toFixed(currencyForeignDecimalPlaces.value)
}

const convertForeignToAmount = () => {
  if (!isConversionValid()) {
    return
  }
  amount.value = convertCurrency(amountForeign.value, currencyForeignCode.value, currencyCode.value).toFixed(currencyDecimalPlaces.value)
}

watch(isFocused, (newValue) => {
  newValue ? animateTransactionAmountOperatorButtons() : null
})
</script>
