<template>
  <div class="mx-f" :class="[attrs.class, { bad: !!error }]" :style="attrs.style">
    <div class="mx-l">{{ $t('amount') }}<span v-if="isAmountRequired" class="req">*</span></div>
    <label class="mx-in mx-amt-in" :class="{ dis: disabled }">
      <app-icon :icon="IconCoins" :size="16" :stroke="2" />
      <input
        ref="inputAmount"
        v-bind="amountInput"
        type="text"
        inputmode="decimal"
        placeholder="0"
        class="transaction-amount-field-input"
        :name="attrs.name"
        :disabled="disabled"
        :aria-label="$t('amount')"
        @focus="onFocus"
        @blur="onBlur"
      />
      <span v-if="currencySymbol" class="suf">{{ currencySymbol }}</span>
    </label>
    <div v-if="error" class="mx-ferr">{{ error }}</div>

    <div v-if="expression" class="mx-calc" :class="{ bad: expression.result === null }">
      <span>{{ expression.text }}</span>
      <b>= {{ expression.result ?? '?' }}</b>
    </div>

    <transaction-amount-field-operations v-if="isFocused && !disabled" @result="onOperation" />

    <div v-if="showQuickButtons && !disabled" class="mx-quick" role="group" :aria-label="$t('settings.transactions.quick_amounts.title')">
      <button v-for="quickButton in profileStore.quickValueButtons" :key="quickButton" type="button" class="mx-quick__b" @mousedown.prevent @click="onQuickButton(quickButton)">
        {{ quickButton }}
      </button>
    </div>
  </div>

  <div v-if="isForeignAmountVisible" class="mx-f fx-box" :class="{ bad: !!errorForeign }" :style="attrs.style">
    <div class="mx-l">{{ $t('desktop.foreign_amount') }}<span v-if="isForeignAmountRequired" class="req">*</span></div>
    <div class="mx-in" :class="{ dis: disabled }" @click.self="inputAmountForeign?.focus()">
      <currency-dropdown v-model="currencyForeign" />
      <input ref="inputAmountForeign" v-model="amountForeign" type="text" inputmode="decimal" placeholder="0" :disabled="disabled" :aria-label="$t('desktop.foreign_amount')" />
    </div>
    <div v-if="errorForeign" class="mx-ferr">{{ errorForeign }}</div>
    <div v-if="isConvertButtonVisible" class="fx-rrow">
      <span class="fx-rate">{{ exchangeRateLabel }}</span>
      <span class="fx-rbtns">
        <button type="button" class="fx-fill" @click="convertForeignToAmount">
          <app-icon :icon="IconArrowUp" :size="14" :stroke="2" />
          <span>{{ $t('transaction.convert_from', { currency: currencyForeignCode }) }}</span>
        </button>
        <button type="button" class="fx-fill" @click="convertAmountToForeign">
          <app-icon :icon="IconArrowDown" :size="14" :stroke="2" />
          <span>{{ $t('transaction.convert_from', { currency: currencyCode }) }}</span>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { IconArrowDown, IconArrowUp, IconCoins } from '@tabler/icons-vue'
import { evalMath, removeEndOperators, sanitizeAmount } from '~/core/utils/MathUtils'
import { formatAmount } from '~/core/utils/AmountUtils.js'
import Currency from '~/core/models/Currency.js'
import { useCurrencyConversion } from '~/core/composables/useCurrencyConversion.js'
import { useAmountInput } from '~/core/composables/useAmountInput.js'
import { useFormField } from '~/mobile/composables/useFormField.js'

// Amount input with calculator keys, quick amounts and the optional foreign amount (design: MX-AmountField / MX-AmountFieldFx).
// `rules` / `name` / `style` come in as attributes.
defineOptions({ inheritAttrs: false })

const profileStore = useProfileStore()
const attrs = useAttrs()

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
  isForeignAmountRequired: {
    type: Boolean,
    default: false,
  },
})

const amountRules = computed(() => [...(props.isAmountRequired ? [{ required: true, message: 'Amount is required' }] : []), ...(attrs.rules ?? [])])
const foreignAmountRules = computed(() => [...(props.isForeignAmountRequired ? [{ required: true, message: 'Foreign amount is required' }] : []), ...(attrs.rules ?? [])])

const inputAmount = ref(null)
const inputAmountForeign = ref(null)

const { error } = useFormField({ name: () => attrs.name ?? 'amount', rules: amountRules, value: amount, el: () => inputAmount.value })
const { error: errorForeign } = useFormField({
  name: () => 'amountForeign',
  rules: () => (props.isForeignAmountVisible ? foreignAmountRules.value : []),
  value: amountForeign,
  el: () => inputAmountForeign.value,
})

const currencySymbol = computed(() => Currency.getSymbol(props.currency))
const currencyCode = computed(() => Currency.getCode(props.currency))
const currencyForeignCode = computed(() => Currency.getCode(currencyForeign.value))
const currencyDecimalPlaces = computed(() => Currency.getDecimalPlaces(props.currency))
const currencyForeignDecimalPlaces = computed(() => Currency.getDecimalPlaces(currencyForeign.value))
const isConvertButtonVisible = computed(() => props.isForeignAmountVisible && currencyForeign.value)

const exchangeRateLabel = computed(() => {
  const rate = convertCurrency(1, currencyForeignCode.value, currencyCode.value)
  return Number.isFinite(rate) ? `1 ${currencyForeignCode.value} = ${formatAmount(rate.toFixed(4), profileStore.numberFormat.code)} ${currencyCode.value}` : ''
})

// Live preview of a typed expression, e.g. "12+30*2 = 72"
const expression = computed(() => {
  const text = `${amount.value ?? ''}`
  if (!/[+\-*/]/.test(text.replace(/^-/, ''))) return null
  const { wasSuccessful, value } = evalMath(removeEndOperators(text))
  return { text, result: wasSuccessful && Number.isFinite(value) ? formatAmount(value.toFixed(currencyDecimalPlaces.value ?? 2), profileStore.numberFormat.code) : null }
})

const { input: amountInput, onFocus: onAmountInputFocus, onBlur: onAmountInputBlur } = useAmountInput(amount)

const onQuickButton = (quickButton) => {
  const value = !amount.value || amount.value === '' ? '0' : amount.value
  const newAmount = parseFloat(value) + parseFloat(quickButton)
  amount.value = newAmount.toFixed(currencyDecimalPlaces.value ?? 2)
}

const evaluateAmount = async () => {
  const currentAmount = amount.value
  let newAmount = currentAmount ? await evaluateModelValue(currentAmount) : null
  if (newAmount != null) {
    newAmount = newAmount.toFixed(currencyDecimalPlaces.value ?? 2)
  }
  amount.value = newAmount ?? currentAmount
}

const onFocus = () => {
  isFocused.value = true
  onAmountInputFocus()
}

const onBlur = async () => {
  await nextTick()
  isFocused.value = false
  await evaluateAmount()
  onAmountInputBlur()

  // On iOS if you hide the keyboard via the "Done" button, onBlur gets called but it's not actually blurred. This is a temp fix...
  inputAmount.value?.blur()
}

const { evaluateModelValue, convertAmountToForeign, convertForeignToAmount } = useCurrencyConversion({
  amount,
  amountForeign,
  currencyForeign,
  currencyCode,
  currencyForeignCode,
  currencyDecimalPlaces,
  currencyForeignDecimalPlaces,
  currency: computed(() => props.currency),
})

const onOperation = async (button) => {
  if (button.value === 'C') {
    amount.value = ''
    return
  }
  if (button.value === '=') {
    await evaluateAmount()
    return
  }
  amount.value = sanitizeAmount(`${amount.value ?? ''}${button.value}`)
}
</script>
