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
              ref="inputAmount"
              :value="displayValue"
              style="width: 100%; border: none; background: transparent; height: 24px"
              type="text"
              inputmode="decimal"
              class="transaction-amount-field-input"
              @focus="onFocus"
              @blur="onBlur"
              @input="onInput"
            >
            <van-button v-if="isConvertButtonVisible" size="small" class="" @click="convertAmountToForeign">
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
          label="Foreign amount"
          class="flex-1 flex-center-vertical app-field transaction-amount-field transaction-foreign-amount-field"
          v-bind="foreignAmountBindings"
          label-align="top"
          @click="() => inputAmountForeign.focus()"
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
              <input ref="inputAmountForeign" v-model="amountForeign" style="width: 100%; border: none; background: transparent; height: 24px" type="text" inputmode="decimal" >

              <van-button v-if="isConvertButtonVisible" size="small" class="" @click="convertForeignToAmount">
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
          <td v-for="quickButton in quickButtons" :key="quickButton">
            <van-button class="w-100 transaction-amount-button" type="default" size="normal" @mousedown.prevent.stop="onQuickButton(quickButton)">
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
import { sanitizeAmount } from '~/utils/MathUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Currency from '~/models/Currency.js'
import { animateTransactionAmountOperatorButtons } from '~/utils/AnimationUtils.js'
import { useCurrencyConversion } from '~/composables/useCurrencyConversion.js'
import { useAmountFormat } from '~/composables/useAmountFormat'

const device = useDevice()
const profileStore = useProfileStore()
const attrs = useAttrs()

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
  isForeignAmountRequired: {
    type: Boolean,
    default: false,
  },
})

const amount = defineModel('amount')
const amountForeign = defineModel('amountForeign')
const currencyForeign = defineModel('currencyForeign')

const inputAmount = ref(null)
const inputAmountForeign = ref(null)

const localeCode = computed(() => profileStore.numberFormat.code)

const {
  displayValue,
  onInput,
  onFocus,
  onBlur,
  refreshDisplay,
  isFocused,
} = useAmountFormat({
  modelValue: amount,
  currencyDecimalPlaces: computed(() => Currency.getDecimalPlaces(props.currency)),
  localeCode,
  inputRef: inputAmount,
})
const amountBindings = computed(() => {
  const rules = [...(attrs.rules ?? [])]
  if (props.isAmountRequired) {
    rules.unshift({ required: true, message: 'Amount is required' })
  }
  return {
    ...attrs,
    required: props.isAmountRequired || attrs.required,
    rules,
  }
})
const foreignAmountBindings = computed(() => {
  const rules = [...(attrs.rules ?? [])]
  if (props.isForeignAmountRequired) {
    rules.unshift({ required: true, message: 'Foreign amount is required' })
  }
  return {
    ...attrs,
    required: props.isForeignAmountRequired || attrs.required,
    rules,
  }
})

const currencySymbol = computed(() => Currency.getSymbol(props.currency))

const currencyCode = computed(() => Currency.getCode(props.currency))
const currencyForeignCode = computed(() => Currency.getCode(currencyForeign.value))

const currencyDecimalPlaces = computed(() => Currency.getDecimalPlaces(props.currency))
const currencyForeignDecimalPlaces = computed(() => Currency.getDecimalPlaces(currencyForeign.value))
const isConvertButtonVisible = computed(() => props.isForeignAmountVisible && currencyForeign.value)

const quickButtons = profileStore.quickValueButtons

const onQuickButton = async (quickButton) => {
  const value = !amount.value || amount.value === '' ? '0' : amount.value
  const newAmount = parseFloat(value) + parseFloat(quickButton)
  amount.value = newAmount.toFixed(currencyDecimalPlaces.value ?? 2)
  refreshDisplay()
}

const { convertAmountToForeign, convertForeignToAmount } = useCurrencyConversion({
  amount,
  amountForeign,
  currencyForeign,
  currencyCode,
  currencyForeignCode,
  currencyDecimalPlaces,
  currencyForeignDecimalPlaces,
  currency: computed(() => props.currency)
})

const onOperation = async (button) => {
  amount.value = sanitizeAmount(amount.value + button.value)
  refreshDisplay()
}

watch(isFocused, (newValue) => {
  if (newValue) {
    animateTransactionAmountOperatorButtons()
  }
})
</script>
