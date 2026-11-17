<template>
  <span class="mx-cdd">
    <button type="button" class="mx-btn sm out" aria-haspopup="dialog" :aria-label="$t('currency_select.title')" @click.stop="showDropdown = true">
      <app-icon :icon="IconCoins" :size="16" :stroke="2" />
      <span>{{ currencyCode ?? $t('currency') }}</span>
      <app-icon :icon="IconChevronDown" :size="16" :stroke="2" />
    </button>
    <button v-if="modelValue && isClearable" type="button" class="mx-ib sm" :aria-label="$t('clear')" @click.stop="modelValue = null">
      <app-icon :icon="IconX" :size="16" :stroke="2" />
    </button>

    <app-sheet v-model:show="showDropdown" v-model:search="search" :title="$t('currency_select.title')" :searchable="list.length > 7">
      <button v-for="item in filteredList" :key="item.id" type="button" class="mx-opt" :class="{ on: item.id === modelValue?.id }" :aria-pressed="item.id === modelValue?.id" @click="onSelect(item)">
        <span class="ic"><app-icon :icon="IconCoins" :size="16" :stroke="2" /></span>
        <span class="lb">{{ Currency.getName(item) }}</span>
        <span class="mt">{{ Currency.getCode(item) }}</span>
        <span class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
      </button>
      <div v-if="filteredList.length === 0" class="mx-none">{{ $t('no_matches') }}</div>
    </app-sheet>
  </span>
</template>

<script setup>
import { IconCheck, IconChevronDown, IconCoins, IconX } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import Currency from '~/core/models/Currency'

// Compact currency switch (design: dashboard currency button). Add class="borderless" for the pill used inside an input.
const modelValue = defineModel()

defineProps({
  isClearable: { default: false },
})

const currencyStore = useCurrencyStore()
const showDropdown = ref(false)
const search = ref('')

const list = computed(() => currencyStore.currenciesList.filter((item) => get(item, 'attributes.enabled')))
const filteredList = computed(() => list.value.filter((item) => LanguageUtils.includesSearch(`${Currency.getName(item)} ${Currency.getCode(item)}`, search.value)))

const currencyCode = computed(() => Currency.getCode(modelValue.value))

const onSelect = (item) => {
  modelValue.value = item
  showDropdown.value = false
}
</script>
