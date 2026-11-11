<template>
  <app-sheet v-model:show="modelValueShow" :title="title ?? $t('kit.choose_time')">
    <div class="mx-tp">
      <div class="mx-tp__v">{{ hour }}:{{ minute }}</div>
      <div class="mx-ogrp">{{ $t('kit.hour') }}</div>
      <div class="mx-tp__g">
        <button v-for="value in hours" :key="value" type="button" :class="{ on: value === hour }" @click="modelValue = `${value}:${minute}`">{{ value }}</button>
      </div>
      <div class="mx-ogrp">{{ $t('kit.minute') }}</div>
      <div class="mx-tp__g">
        <button v-for="value in minutes" :key="value" type="button" :class="{ on: value === minute }" @click="modelValue = `${hour}:${value}`">{{ value }}</button>
      </div>
    </div>

    <template #footer>
      <button type="button" class="mx-btn out" @click="onNow">{{ $t('kit.now') }}</button>
      <button type="button" class="mx-btn pri" @click="modelValueShow = false">{{ $t('done') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
// Time sheet (design: MX-TimePicker): hour and 5-minute grids, value as 'HH:mm'.
const modelValueShow = defineModel('show')
const modelValue = defineModel()

defineProps({
  title: { type: String, default: null },
})

const pad = (value) => String(value).padStart(2, '0')
const hours = Array.from({ length: 24 }, (_, index) => pad(index))
const minutes = Array.from({ length: 12 }, (_, index) => pad(index * 5))

const hour = computed(() => (modelValue.value || '00:00').split(':')[0])
const minute = computed(() => (modelValue.value || '00:00').split(':')[1])

const onNow = () => (modelValue.value = DateUtils.dateToString(new Date(), 'HH:mm'))
</script>
