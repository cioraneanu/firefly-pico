<template>
  <app-sheet v-model:show="showDropdown" :title="popupTitle ?? $t('kit.choose_month')">
    <div class="mx-yr">
      <button type="button" class="mx-ib sm out" :aria-label="$t('kit.previous_year')" @click="year--">
        <app-icon :icon="IconChevronLeft" :size="16" :stroke="2" />
      </button>
      <b>{{ year }}</b>
      <button type="button" class="mx-ib sm out" :aria-label="$t('kit.next_year')" @click="year++">
        <app-icon :icon="IconChevronRight" :size="16" :stroke="2" />
      </button>
    </div>
    <div class="mx-mgrid pb-2" role="radiogroup" :aria-label="popupTitle ?? $t('kit.choose_month')">
      <button v-for="(name, month) in months" :key="month" type="button" role="radio" :class="{ on: isSelected(month) }" :aria-checked="isSelected(month)" @click="onPick(month)">
        {{ name }}
      </button>
    </div>
  </app-sheet>
</template>

<script setup>
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import { upperFirst } from 'lodash-es'

// Month picker sheet (design: MX-DashPeriod month grid). The value is the first day of the picked month.
const modelValue = defineModel()
const showDropdown = defineModel('showDropdown', { type: Boolean, default: false })

defineProps({
  popupTitle: { type: String, default: null },
})

const { locale } = useI18n()
const months = computed(() => Array.from({ length: 12 }, (_, month) => upperFirst(new Intl.DateTimeFormat(locale.value, { month: 'short' }).format(new Date(2000, month, 1)))))

const year = ref(new Date().getFullYear())
watch(showDropdown, (isShown) => isShown && (year.value = (modelValue.value ?? new Date()).getFullYear()), { immediate: true })

const isSelected = (month) => !!modelValue.value && modelValue.value.getFullYear() === year.value && modelValue.value.getMonth() === month

const onPick = (month) => {
  if (!isSelected(month)) {
    modelValue.value = new Date(year.value, month, 1)
  }
  showDropdown.value = false
}
</script>
