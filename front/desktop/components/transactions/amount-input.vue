<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <label
        :class="[
          'flex h-8 min-w-45 flex-1 items-center rounded-lg border border-field transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-field/30',
          isInvalid && 'border-danger ring-3 ring-danger/20',
        ]"
      >
        <input v-bind="amountInput" inputmode="decimal" placeholder="0" :autofocus class="h-full min-w-0 flex-1 px-2.5 text-sm font-medium tabular-nums" @focus="onAmountFocus" @blur="onBlur" />
        <span class="mr-2.5 text-dim">{{ Currency.getSymbol(currency) }}</span>
      </label>
      <div class="flex flex-wrap gap-1.5">
        <d-button v-for="value in profileStore.quickValueButtons" :key="value" size="sm" class="min-w-10 tabular-nums" @click="addQuickValue(value)">{{ value }}</d-button>
      </div>
    </div>
    <div v-if="foreign" class="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2">
      <d-input v-model="amountForeign" type="number" step="any" :placeholder="$t('desktop.foreign_amount')" />
      <d-currency-select v-model="currencyForeign" clearable />
      <span class="flex">
        <d-button variant="ghost" size="icon" :icon="IconArrowDown" :title="$t('desktop.convert')" @click="convertAmountToForeign" />
        <d-button variant="ghost" size="icon" :icon="IconArrowUp" :title="$t('desktop.convert')" @click="convertForeignToAmount" />
      </span>
    </div>
  </div>
</template>

<script setup>
import { IconArrowDown, IconArrowUp } from '@tabler/icons-vue'
import Currency from '~/core/models/Currency'

const amount = defineModel('amount')
const amountForeign = defineModel('amountForeign')
const currencyForeign = defineModel('currencyForeign')
const props = defineProps({ currency: Object, foreign: Boolean, autofocus: Boolean })

const profileStore = useProfileStore()
const field = inject('d-field', null)
const isInvalid = computed(() => !!field?.error.value)
const decimals = computed(() => Currency.getDecimalPlaces(props.currency) ?? 2)

const { input: amountInput, onFocus: onAmountFocus, onBlur: onAmountBlur } = useAmountInput(amount)
const { evaluateModelValue, convertAmountToForeign, convertForeignToAmount } = useCurrencyConversion({
  amount,
  amountForeign,
  currencyForeign,
  currencyCode: computed(() => Currency.getCode(props.currency)),
  currencyForeignCode: computed(() => Currency.getCode(currencyForeign.value)),
  currencyDecimalPlaces: decimals,
  currencyForeignDecimalPlaces: computed(() => Currency.getDecimalPlaces(currencyForeign.value) ?? 2),
  currency: computed(() => props.currency),
})

const onBlur = async () => {
  const value = amount.value ? await evaluateModelValue(amount.value) : null
  if (value != null) amount.value = value.toFixed(decimals.value)
  onAmountBlur()
}

const addQuickValue = (value) => (amount.value = (parseFloat(amount.value || 0) + parseFloat(value)).toFixed(decimals.value))
</script>
